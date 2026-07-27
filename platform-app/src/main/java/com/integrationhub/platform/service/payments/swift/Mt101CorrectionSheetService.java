package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.vertical.swift.mt101.repository.Mt101FailedRecordRepository;
import com.integrationhub.vertical.swift.mt101.repository.Mt101FailedRecordRepository.CorrectionSheetRow;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.service.task.writer.FileFormatWriterRegistry;
import com.integrationhub.platform.spi.reader.ReadRecord;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.io.IOException;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

/**
 * ADR-020 (C1): genera la PLANILLA DE CORRECCION (XLSX) de las filas en cuarentena de un set. Cada fila lleva
 * columnas de IDENTIDAD bloqueadas (prefijo {@code _}: stagingId/version/hash/fila/:20:) para re-matchear en el
 * import, el DIAGNOSTICO (rule_code/error) y los CAMPOS EDITABLES del payload (aplanados). El operador corrige
 * offline (fill-down, buscar/reemplazar) y re-sube la planilla (C2/C3).
 *
 * <p><b>Streaming:</b> reusa el {@code XlsxWriter} de la capa de salida (POI SXSSF) via
 * {@link FileFormatWriterRegistry} y escribe DIRECTO al {@link OutputStream} de la respuesta HTTP — no
 * materializa el XLSX en memoria (nada de {@code byte[]}). <b>Money-safety:</b> read-only, no muta nada.
 */
@ApplicationScoped
public class Mt101CorrectionSheetService {

    // Nombres de las columnas de identidad + diagnostico (prefijo _ = no editable). UNICO dueno del formato:
    // el export (writeSheet) las escribe y el import (parseSheet) las lee — sin duplicar literales en otra clase.
    public static final String COL_STAGING_ID = "_stagingId";
    public static final String COL_VERSION = "_version";
    public static final String COL_SOURCE_FILE_HASH = "_sourceFileHash";
    public static final String COL_RECORD_NUMBER = "_recordNumber";
    public static final String COL_SENDERS_REFERENCE = "_sendersReference";
    public static final String COL_RULE_CODE = "_ruleCode";
    public static final String COL_ERROR = "_error";

    /** Columnas de identidad + diagnostico, en orden (el import las reconoce por el prefijo {@code _}). */
    static final List<String> META_COLUMNS = List.of(
            COL_STAGING_ID, COL_VERSION, COL_SOURCE_FILE_HASH, COL_RECORD_NUMBER, COL_SENDERS_REFERENCE,
            COL_RULE_CODE, COL_ERROR);

    private static final int MAX_ROWS = 20000;
    private static final int BATCH = 500;

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101FailedRecordRepository failedRecordRepository;
    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final FileFormatWriterRegistry writerRegistry;

    @Inject
    public Mt101CorrectionSheetService(DataSource defaultDataSource,
                                       ConnectionPoolManager connectionPoolManager,
                                       Mt101FailedRecordRepository failedRecordRepository,
                                       JsonConfigurationMapper jsonConfigurationMapper,
                                       FileFormatWriterRegistry writerRegistry) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.failedRecordRepository = failedRecordRepository;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.writerRegistry = writerRegistry;
    }

    /** Valida los parametros ANTES de empezar a streamear (para devolver 400, no romper a mitad del stream). */
    public void validate(String fragmentSetId) {
        if (fragmentSetId == null || fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId is required");
        }
    }

    /**
     * Escribe la planilla de correccion directo al {@code out} (streaming). Lee las filas en cuarentena, aplana
     * el payload en columnas y delega el XLSX al {@code XlsxWriter} compartido.
     */
    public void writeSheet(OutputStream out, String connectionRef, String fragmentSetId, String status,
                           String ruleCode) {
        validate(fragmentSetId);
        var effectiveStatus = status == null || status.isBlank() ? "QUARANTINED" : status.trim();
        var dataSource = resolveDataSource(connectionRef);
        List<CorrectionSheetRow> rows;
        try {
            rows = failedRecordRepository.correctionSheetRows(dataSource, fragmentSetId.trim(), effectiveStatus,
                    blankToNull(ruleCode), MAX_ROWS);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot read correction sheet rows for set " + fragmentSetId, error);
        }

        // Aplana los payloads y arma la union de claves (orden de primera aparicion) para las columnas editables.
        var payloads = new ArrayList<Map<String, Object>>(rows.size());
        var editableColumns = new LinkedHashSet<String>();
        for (var row : rows) {
            Map<String, Object> map = row.payloadJson() == null || row.payloadJson().isBlank()
                    ? Map.of()
                    : jsonConfigurationMapper.toMap(row.payloadJson());
            payloads.add(map);
            editableColumns.addAll(map.keySet());
        }
        var editable = new ArrayList<>(editableColumns);
        var columns = new ArrayList<String>(META_COLUMNS.size() + editable.size());
        columns.addAll(META_COLUMNS);
        columns.addAll(editable);

        var writer = writerRegistry.resolve("XLSX");
        try (var session = writer.open(out, sheetConfig(columns))) {
            session.writeHeader(new ArrayList<>(columns));
            var batch = new ArrayList<ReadRecord>(BATCH);
            for (var i = 0; i < rows.size(); i++) {
                batch.add(toRecord(rows.get(i), payloads.get(i)));
                if (batch.size() >= BATCH) {
                    session.writeDetail(batch);
                    batch.clear();
                }
            }
            if (!batch.isEmpty()) {
                session.writeDetail(batch);
            }
        } catch (IOException error) {
            throw new UncheckedIOException("Cannot stream correction sheet for set " + fragmentSetId, error);
        }
    }

    /**
     * Config del XlsxWriter: cada columna como {field} (texto) — identidad como texto para re-parsear sin sorpresas.
     * Las columnas de IDENTIDAD/DIAGNOSTICO (prefijo {@code _}) van {@code locked=true} y la hoja se protege
     * ({@code protect}): en Excel quedan read-only, asi el operador NO puede corromper la identidad de re-match por
     * accidente (fill-down, buscar/reemplazar). Las columnas del payload quedan editables (locked=false).
     */
    private Map<String, Object> sheetConfig(List<String> columns) {
        var columnList = new ArrayList<Map<String, Object>>(columns.size());
        for (var name : columns) {
            columnList.add(Map.of("field", name, "locked", name.startsWith("_")));
        }
        return Map.of(
                "layout", Map.of("detail", Map.of("columns", columnList)),
                "xlsx", Map.of("sheetName", "Correccion", "freezeHeader", true, "protect", true));
    }

    private ReadRecord toRecord(CorrectionSheetRow source, Map<String, Object> payload) {
        var values = new LinkedHashMap<String, Object>();
        values.put(COL_STAGING_ID, source.stagingId() == null ? "" : String.valueOf(source.stagingId()));
        values.put(COL_VERSION, String.valueOf(source.version()));
        values.put(COL_SOURCE_FILE_HASH, nz(source.sourceFileHash()));
        values.put(COL_RECORD_NUMBER, source.recordNumber() == null ? "" : String.valueOf(source.recordNumber()));
        values.put(COL_SENDERS_REFERENCE, nz(source.sendersReference()));
        values.put(COL_RULE_CODE, nz(source.ruleCode()));
        values.put(COL_ERROR, nz(source.message()));
        for (var entry : payload.entrySet()) {
            values.put(entry.getKey(), entry.getValue());
        }
        return new ReadRecord(values);
    }

    // ------------------------------------------------------------------ import: parseo header-driven (POI)

    /**
     * ADR-020 (C2/C3): parsea la planilla de correccion subida en filas por nombre de columna (header-driven).
     * Este metodo es el DUENO del formato en lectura (simetrico a {@link #writeSheet}); el bulk-correction depende
     * de el para el preview/apply. Fail-loud: rechaza una planilla que exceda {@value #MAX_ROWS} filas (no trunca
     * en silencio filas del money-path). No usa el reader posicional de FILE_READ: la planilla es AUTO-DESCRIPTIVA
     * (el header nombra las columnas dinamicas), asi que su lectura es una responsabilidad propia.
     */
    public List<SheetRow> parseSheet(java.io.InputStream xlsx) {
        try (var workbook = org.apache.poi.ss.usermodel.WorkbookFactory.create(xlsx)) {
            var sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
                throw new IllegalArgumentException("the uploaded correction sheet is empty");
            }
            var formatter = new org.apache.poi.ss.usermodel.DataFormatter();
            var headerRow = sheet.getRow(sheet.getFirstRowNum());
            var header = new ArrayList<String>();
            for (var c = 0; c < headerRow.getLastCellNum(); c++) {
                header.add(cellString(headerRow.getCell(c), formatter));
            }
            var rows = new ArrayList<SheetRow>();
            for (var r = sheet.getFirstRowNum() + 1; r <= sheet.getLastRowNum(); r++) {
                var dataRow = sheet.getRow(r);
                if (dataRow == null) {
                    continue;
                }
                var cells = new LinkedHashMap<String, String>();
                for (var c = 0; c < header.size(); c++) {
                    var name = header.get(c);
                    if (name != null && !name.isBlank()) {
                        cells.put(name, cellString(dataRow.getCell(c), formatter));
                    }
                }
                rows.add(new SheetRow(cells));
                if (rows.size() > MAX_ROWS) {
                    throw new IllegalArgumentException("the correction sheet exceeds " + MAX_ROWS
                            + " rows; split it and re-import (no rows are silently dropped)");
                }
            }
            return rows;
        } catch (IOException | RuntimeException error) {
            if (error instanceof IllegalArgumentException iae) {
                throw iae;
            }
            throw new IllegalArgumentException("Cannot read the uploaded correction sheet: " + error.getMessage(),
                    error);
        }
    }

    private String cellString(org.apache.poi.ss.usermodel.Cell cell,
                              org.apache.poi.ss.usermodel.DataFormatter formatter) {
        if (cell == null) {
            return "";
        }
        return formatter.formatCellValue(cell).trim();
    }

    /** Una fila de la planilla: celdas por nombre de columna. Las {@code _}-prefijadas son identidad/diagnostico. */
    public record SheetRow(Map<String, String> cells) {
        public String stringValue(String column) {
            var value = cells.get(column);
            return value == null || value.isBlank() ? null : value.trim();
        }

        public Long longValue(String column) {
            var value = stringValue(column);
            if (value == null) {
                return null;
            }
            try {
                return Long.parseLong(value.contains(".") ? value.substring(0, value.indexOf('.')) : value);
            } catch (NumberFormatException error) {
                return null;
            }
        }

        /** Columnas editables = las que NO empiezan con {@code _} (identidad/diagnostico). */
        public java.util.Set<String> editableKeys() {
            var keys = new LinkedHashSet<String>();
            for (var key : cells.keySet()) {
                if (key != null && !key.startsWith("_")) {
                    keys.add(key);
                }
            }
            return keys;
        }
    }

    private String nz(String value) {
        return value == null ? "" : value;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }
}
