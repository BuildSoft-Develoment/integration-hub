package com.integrationhub.vertical.swift.mt101.service;

import com.integrationhub.vertical.swift.mt101.repository.Mt101FragmentRepository;
import com.integrationhub.vertical.swift.mt101.repository.Mt101StagingRecordRepository;
import com.integrationhub.platform.spi.engine.JdbcConnectionResolver;
import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.List;

/** Consulta operacional para resolver filas origen hacia fragmentos MT101. */
@ApplicationScoped
public class Mt101FragmentLookupService {

    private final DataSource defaultDataSource;
    private final JdbcConnectionResolver connectionPoolManager;
    private final Mt101FragmentRepository repository;
    private final Mt101StagingRecordRepository stagingRepository;

    public Mt101FragmentLookupService(DataSource defaultDataSource,
                                      JdbcConnectionResolver connectionPoolManager,
                                      Mt101FragmentRepository repository,
                                      Mt101StagingRecordRepository stagingRepository) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.repository = repository;
        this.stagingRepository = stagingRepository;
    }

    /**
     * G-A (búsqueda inversa enriquecida): resuelve "archivo + línea física" a <b>todos</b> los registros de staging
     * (uno por ejecución: reprocesos visibles), cada uno con su resumen de cuarentena si falló validación (regla +
     * motivo + :20:/:21:). {@code processExecutionId} opcional acota a una ejecución.
     */
    public List<Mt101StagingRecordRepository.PhysicalLineLineage> findLineageByPhysicalLine(String connectionRef,
                                                                                            String sourceFileHash,
                                                                                            long physicalLine,
                                                                                            Long processExecutionId) {
        if (physicalLine < 1) {
            throw new IllegalArgumentException("physicalLine must be positive");
        }
        var hash = requireSourceFileHash(sourceFileHash);
        try {
            return stagingRepository.findLineageByPhysicalLine(resolveDataSource(connectionRef), hash, physicalLine,
                    processExecutionId);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot resolve staging row for physical line " + physicalLine, error);
        }
    }

    /**
     * #4 (Excel): resuelve "archivo + hoja + fila Excel" a la lista de registros de staging (uno por ejecución), cada
     * uno con su resumen de cuarentena. Espejo de {@link #findLineageByPhysicalLine} para la clave operativa de Excel.
     */
    public List<Mt101StagingRecordRepository.PhysicalLineLineage> findLineageBySheetRow(String connectionRef,
                                                                                        String sourceFileHash,
                                                                                        String sheetName,
                                                                                        long sheetRow,
                                                                                        Long processExecutionId) {
        if (sheetRow < 1) {
            throw new IllegalArgumentException("sheetRow must be positive");
        }
        var hash = requireSourceFileHash(sourceFileHash);
        try {
            return stagingRepository.findLineageBySheetRow(resolveDataSource(connectionRef), hash, sheetName, sheetRow,
                    processExecutionId);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot resolve staging row for sheet " + sheetName + " row " + sheetRow,
                    error);
        }
    }

    public List<Mt101FragmentRepository.FragmentLookupRow> findBySourceRow(String connectionRef,
                                                                           Long recordNumber,
                                                                           String sourceFileHash,
                                                                           String sourceTable,
                                                                           Long processExecutionId,
                                                                           String fragmentSetId,
                                                                           int limit) {
        if (recordNumber == null || recordNumber < 1) {
            throw new IllegalArgumentException("recordNumber must be positive");
        }
        var hash = requireSourceFileHash(sourceFileHash);
        try {
            return repository.findBySourceRecord(resolveDataSource(connectionRef),
                    recordNumber, hash, blankToNull(sourceTable), processExecutionId,
                    blankToNull(fragmentSetId), Math.min(Math.max(limit, 1), 100));
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot resolve MT101 fragment for source row " + recordNumber, error);
        }
    }

    /** Resumen del lote: conteo de fragmentos por estado + total. */
    public List<Mt101FragmentRepository.StatusCount> statusCounts(String connectionRef, String fragmentSetId) {
        if (fragmentSetId == null || fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId is required");
        }
        try {
            return repository.statusCountsBySet(resolveDataSource(connectionRef), fragmentSetId.trim());
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot summarize MT101 fragment set " + fragmentSetId, error);
        }
    }

    /** Item 3 (visibilidad): fragmentos en conflicto de pago del set (con motivo), para que la UI los concilie. */
    public List<Mt101FragmentRepository.PayConflictRow> payConflicts(String connectionRef, String fragmentSetId) {
        if (fragmentSetId == null || fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId is required");
        }
        try {
            return repository.conflictedFragments(resolveDataSource(connectionRef), fragmentSetId.trim());
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot list MT101 pay conflicts for set " + fragmentSetId, error);
        }
    }

    /** Cota por defecto/máxima de la consola de conflictos (el conflicto es excepcional; no debería acercarse). */
    private static final int DEFAULT_OPEN_CONFLICTS_LIMIT = 200;
    private static final int MAX_OPEN_CONFLICTS_LIMIT = 1000;
    /** Cota de confirmaciones por conflicto (evidencia inline): un pago tiene pocas confirmaciones. */
    private static final int DEFAULT_CONFLICT_CONFIRMATIONS_LIMIT = 20;

    /**
     * Consola de PAY Conflicts (A1 — evidencia inline): confirmación(es) del banco para un {@code :20:} (gatewayReference
     * + último STATUS), la evidencia de por qué el fragmento quedó en conflicto. Solo lectura.
     */
    public List<Mt101FragmentRepository.OpenPayConflictConfirmation> payConflictConfirmations(String connectionRef,
                                                                                              String sendersReference,
                                                                                              Long processExecutionId) {
        if (sendersReference == null || sendersReference.isBlank()) {
            throw new IllegalArgumentException("sendersReference is required");
        }
        if (processExecutionId == null) {
            throw new IllegalArgumentException("processExecutionId is required to scope the confirmation evidence "
                    + "to this conflict (the SWIFT reference repeats across runs of the same process)");
        }
        try {
            return repository.payConflictConfirmations(resolveDataSource(connectionRef), sendersReference.trim(),
                    processExecutionId, DEFAULT_CONFLICT_CONFIRMATIONS_LIMIT);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot list confirmations for " + sendersReference, error);
        }
    }

    /** Página del inbox de conflictos: los items + un cursor opaco para la siguiente página ({@code null} = fin). */
    public record OpenPayConflictsPage(List<Mt101FragmentRepository.OpenPayConflictRow> items, String nextCursor) {
    }

    /**
     * Cursor keyset <b>compuesto</b>: la última posición devuelta de CADA rama ({@code (updatedAt, id)} de normal y de
     * correctivo). Se necesita una posición por rama porque el {@code id} es por-tabla (colisiona entre ledgers); un
     * cursor único no podría reanudar ambas ramas sin saltarse filas.
     */
    private record ConflictCursor(String normalTs, Long normalId, String correctiveTs, Long correctiveId) {
    }

    /**
     * Consola de PAY Conflicts: inbox unificado de conflictos de pago abiertos del catálogo entero (across
     * sets/ejecuciones), NORMAL ({@code mt101_build_fragment}) + CORRECTIVO ({@code mt101_corrective_pay_fragment}), más
     * recientes primero, con paginación <b>keyset compuesta</b> (lossless, sin duplicados). {@code cursorToken} nulo →
     * primera página. Cada rama se reanuda desde SU parte del cursor y trae hasta {@code limit}; se mezclan por
     * {@code updatedAt} desc comparando el <b>instante</b> (parseado), NO el string (ISO-8601 tiene fracciones de
     * longitud variable → lexicográfico ≠ cronológico) y se recorta a {@code limit}. El {@code nextCursor} avanza a la
     * última fila DEVUELTA de cada rama (si una rama no aportó, conserva
     * su parte previa → sus filas fetchadas-pero-recortadas se re-piden), y es {@code null} cuando no quedan más.
     */
    public OpenPayConflictsPage openPayConflicts(String connectionRef, Integer limit, String cursorToken) {
        var effectiveLimit = limit == null || limit < 1 ? DEFAULT_OPEN_CONFLICTS_LIMIT
                : Math.min(limit, MAX_OPEN_CONFLICTS_LIMIT);
        var cursor = decodeCursor(cursorToken);
        try {
            var dataSource = resolveDataSource(connectionRef);
            var normalRows = repository.openPayConflicts(dataSource,
                    toTimestamp(cursor.normalTs()), cursor.normalId(), effectiveLimit);
            var correctiveRows = repository.openCorrectivePayConflicts(dataSource,
                    toTimestamp(cursor.correctiveTs()), cursor.correctiveId(), effectiveLimit);

            var merged = new java.util.ArrayList<Mt101FragmentRepository.OpenPayConflictRow>(
                    normalRows.size() + correctiveRows.size());
            merged.addAll(normalRows);
            merged.addAll(correctiveRows);
            // Orden por INSTANTE (cronológico), no por string: Instant.toString() emite fracciones de longitud variable
            // (0/3/6/9 dígitos) → la comparación lexicográfica NO es cronológica (un segundo entero "…00Z" ordena
            // después de "…00.500Z"). Con el keyset + trim eso perdería filas en el borde de página.
            merged.sort(java.util.Comparator.comparing(
                    (Mt101FragmentRepository.OpenPayConflictRow row) ->
                            row.updatedAt() == null ? null : java.time.Instant.parse(row.updatedAt()),
                    java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())));
            var items = merged.size() > effectiveLimit
                    ? new java.util.ArrayList<>(merged.subList(0, effectiveLimit))
                    : merged;

            // Cursor siguiente: última fila DEVUELTA de cada rama (items va desc → la última que veo de cada source es
            // la más vieja devuelta = la marca de agua). Si una rama no aportó, conserva su parte del cursor entrante.
            var nextNormalTs = cursor.normalTs();
            var nextNormalId = cursor.normalId();
            var nextCorrectiveTs = cursor.correctiveTs();
            var nextCorrectiveId = cursor.correctiveId();
            for (var row : items) {
                if ("CORRECTIVE".equals(row.source())) {
                    nextCorrectiveTs = row.updatedAt();
                    nextCorrectiveId = row.id();
                } else {
                    nextNormalTs = row.updatedAt();
                    nextNormalId = row.id();
                }
            }
            var trimmedOff = merged.size() - items.size();
            var hasMore = trimmedOff > 0
                    || normalRows.size() == effectiveLimit
                    || correctiveRows.size() == effectiveLimit;
            var nextCursor = hasMore && !items.isEmpty()
                    ? encodeCursor(new ConflictCursor(nextNormalTs, nextNormalId, nextCorrectiveTs, nextCorrectiveId))
                    : null;
            return new OpenPayConflictsPage(items, nextCursor);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot list open MT101 pay conflicts", error);
        }
    }

    private static java.sql.Timestamp toTimestamp(String iso) {
        return iso == null || iso.isBlank() ? null : java.sql.Timestamp.from(java.time.Instant.parse(iso));
    }

    /** Codec opaco del cursor compuesto: base64(url) de {@code nTs|nId|cTs|cId} (vacío = null). Robusto: ISO/números no traen '|'. */
    private static String encodeCursor(ConflictCursor c) {
        var raw = nullToEmpty(c.normalTs()) + "|" + idToString(c.normalId()) + "|"
                + nullToEmpty(c.correctiveTs()) + "|" + idToString(c.correctiveId());
        return java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString(raw.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    private static ConflictCursor decodeCursor(String token) {
        if (token == null || token.isBlank()) {
            return new ConflictCursor(null, null, null, null);
        }
        try {
            var raw = new String(java.util.Base64.getUrlDecoder().decode(token), java.nio.charset.StandardCharsets.UTF_8);
            var parts = raw.split("\\|", -1);
            if (parts.length != 4) {
                throw new IllegalArgumentException("Malformed pay-conflicts cursor");
            }
            var cursor = new ConflictCursor(emptyToNull(parts[0]), parseId(parts[1]),
                    emptyToNull(parts[2]), parseId(parts[3]));
            // Valida acá que los timestamps parseen (cursor manipulado) → todo error de cursor mapea a 400, no 500.
            toTimestamp(cursor.normalTs());
            toTimestamp(cursor.correctiveTs());
            return cursor;
        } catch (IllegalArgumentException | java.time.format.DateTimeParseException error) {
            throw new IllegalArgumentException("Invalid pay-conflicts cursor", error);
        }
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static String emptyToNull(String value) {
        return value == null || value.isEmpty() ? null : value;
    }

    private static String idToString(Long id) {
        return id == null ? "" : Long.toString(id);
    }

    private static Long parseId(String value) {
        return value == null || value.isEmpty() ? null : Long.valueOf(value);
    }

    /** Item 3: cuántos fragmentos del set están en conflicto de pago (para el resumen operativo). */
    public long payConflictCount(String connectionRef, String fragmentSetId) {
        if (fragmentSetId == null || fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId is required");
        }
        try {
            return repository.payConflictCount(resolveDataSource(connectionRef), fragmentSetId.trim());
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot count MT101 pay conflicts for set " + fragmentSetId, error);
        }
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String requireSourceFileHash(String sourceFileHash) {
        if (sourceFileHash == null || sourceFileHash.isBlank()) {
            throw new IllegalArgumentException("sourceFileHash is required for MT101 source-row lookup");
        }
        return sourceFileHash.trim();
    }
}
