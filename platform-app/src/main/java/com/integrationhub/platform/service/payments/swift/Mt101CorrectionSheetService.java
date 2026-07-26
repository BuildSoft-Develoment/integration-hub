package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository.CorrectionSheetRow;
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

    /** Columnas de identidad + diagnostico (prefijo {@code _} = no editable; el import las usa para re-matchear). */
    static final List<String> META_COLUMNS = List.of(
            "_stagingId", "_version", "_sourceFileHash", "_recordNumber", "_sendersReference", "_ruleCode", "_error");

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

    /** Config del XlsxWriter: cada columna como {field} (texto) — identidad como texto para re-parsear sin sorpresas. */
    private Map<String, Object> sheetConfig(List<String> columns) {
        var columnList = new ArrayList<Map<String, Object>>(columns.size());
        for (var name : columns) {
            columnList.add(Map.of("field", name));
        }
        return Map.of(
                "layout", Map.of("detail", Map.of("columns", columnList)),
                "xlsx", Map.of("sheetName", "Correccion", "freezeHeader", true));
    }

    private ReadRecord toRecord(CorrectionSheetRow source, Map<String, Object> payload) {
        var values = new LinkedHashMap<String, Object>();
        values.put("_stagingId", source.stagingId() == null ? "" : String.valueOf(source.stagingId()));
        values.put("_version", String.valueOf(source.version()));
        values.put("_sourceFileHash", nz(source.sourceFileHash()));
        values.put("_recordNumber", source.recordNumber() == null ? "" : String.valueOf(source.recordNumber()));
        values.put("_sendersReference", nz(source.sendersReference()));
        values.put("_ruleCode", nz(source.ruleCode()));
        values.put("_error", nz(source.message()));
        for (var entry : payload.entrySet()) {
            values.put(entry.getKey(), entry.getValue());
        }
        return new ReadRecord(values);
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
