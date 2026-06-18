package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.provider.task.payments.swift.Mt101BuildFromTableTaskProvider;
import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Cierra el ciclo de "reprocesar solo lo necesario": re-construye un set correctivo
 * a partir UNICAMENTE de las filas en cuarentena (ya corregidas en staging),
 * reusando el config original del build, y marca los fragmentos originales
 * {@code SUPERSEDED}. No regenera el lote completo. Orquesta; el SQL vive en los
 * repositorios y el build en {@link Mt101BuildFromTableTaskProvider} (ADR-011).
 */
@ApplicationScoped
public class Mt101RebuildService {

    private static final int MAX_QUARANTINE = 5000;

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101BuildFromTableTaskProvider buildProvider;
    private final Mt101BuildConfigSource buildConfigSource;
    private final Mt101FailedRecordRepository failedRecordRepository;
    private final Mt101FragmentRepository fragmentRepository;

    public Mt101RebuildService(DataSource defaultDataSource,
                               ConnectionPoolManager connectionPoolManager,
                               Mt101BuildFromTableTaskProvider buildProvider,
                               Mt101BuildConfigSource buildConfigSource,
                               Mt101FailedRecordRepository failedRecordRepository,
                               Mt101FragmentRepository fragmentRepository) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.buildProvider = buildProvider;
        this.buildConfigSource = buildConfigSource;
        this.failedRecordRepository = failedRecordRepository;
        this.fragmentRepository = fragmentRepository;
    }

    /**
     * Re-construye en {@code correctiveSetId} solo las filas en cuarentena de
     * {@code fragmentSetId} y supersede los fragmentos originales afectados.
     */
    public RebuildResult rebuildFromQuarantine(String connectionRef,
                                               String fragmentSetId,
                                               String correctiveSetId) {
        var set = require(fragmentSetId, "fragmentSetId");
        var corrective = require(correctiveSetId, "correctiveSetId");
        if (corrective.equals(set)) {
            throw new IllegalArgumentException("correctiveSetId must differ from the original fragmentSetId");
        }
        var dataSource = resolveDataSource(connectionRef);
        try {
            // P0: guard contra rebuild parcial. Si hay mas filas en cuarentena que el
            // limite, no procesamos solo una pagina y marcamos TODAS como REBUILT
            // (ocultaria filas sin reprocesar). Fail-fast con instruccion accionable.
            var quarantinedCount = failedRecordRepository.countByStatus(dataSource, set, "QUARANTINED");
            if (quarantinedCount == 0) {
                throw new IllegalArgumentException("no quarantined rows to rebuild in set " + set);
            }
            if (quarantinedCount > MAX_QUARANTINE) {
                throw new IllegalArgumentException(quarantinedCount + " quarantined rows exceed the rebuild limit ("
                        + MAX_QUARANTINE + "); reprocess in pages or raise the limit before rebuilding set " + set);
            }

            var failed = failedRecordRepository.findBySet(dataSource, set, "QUARANTINED", MAX_QUARANTINE);
            // :20: de los fragmentos afectados (un fragmento = un MT101 atomico).
            var references = new ArrayList<String>();
            for (var row : failed) {
                if (row.sendersReference() != null && !row.sendersReference().isBlank()
                        && !references.contains(row.sendersReference())) {
                    references.add(row.sendersReference());
                }
            }
            if (references.isEmpty()) {
                throw new IllegalArgumentException("quarantined rows have no :20: to resolve affected fragments in set " + set);
            }

            var metadata = fragmentRepository.findSetMetadata(dataSource, set);
            if (metadata == null || metadata.taskDefinitionId() == null) {
                throw new IllegalArgumentException("cannot resolve build metadata for fragment set " + set);
            }

            // P0: reconstruir TODAS las filas de los fragmentos afectados, no solo las
            // fallidas. Un MT101 no se envia parcial -> reconstruir solo la fila mala y
            // superseder el fragmento dejaria sin enviar las transacciones validas hermanas.
            var recordIndexIn = affectedRecordIndexes(dataSource, set, references);
            if (recordIndexIn.isEmpty()) {
                throw new IllegalArgumentException("cannot resolve the source rows of affected fragments in set " + set);
            }

            var config = correctiveConfig(
                    buildConfigSource.buildConfig(metadata.taskDefinitionId()),
                    metadata, connectionRef, corrective, recordIndexIn);

            var context = new TaskContext(metadata.processExecutionId(), metadata.taskDefinitionId());
            var result = buildProvider.execute(context, config);
            if (!result.success()) {
                throw new IllegalStateException("corrective MT101 build failed for set " + corrective
                        + ": " + result.details());
            }
            var fragmentCount = result.outputs().get("fragmentCount") instanceof Number n ? n.intValue() : 0;

            var superseded = fragmentRepository.markSupersededByReferences(dataSource, set, references, corrective);
            // Seguro: el guard garantiza que TODAS las QUARANTINED estan dentro del lote
            // reconstruido, asi que marcarlas REBUILT no oculta filas sin procesar.
            var resolved = failedRecordRepository.updateStatusBySet(dataSource, set, "QUARANTINED", "REBUILT");

            return new RebuildResult(corrective, fragmentCount, recordIndexIn.size(), superseded, resolved);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot rebuild MT101 quarantine for set " + set, error);
        }
    }

    /**
     * record_index (0-based) de TODAS las filas de los fragmentos afectados ({@code :20:}),
     * para reconstruir el fragmento completo. Ordenado y sin duplicados.
     */
    private List<Long> affectedRecordIndexes(DataSource dataSource, String fragmentSetId,
                                             List<String> references) throws SQLException {
        var indexes = new java.util.TreeSet<Long>();
        for (var range : fragmentRepository.sourceRecordRangesByReferences(dataSource, fragmentSetId, references)) {
            if (range.from() == null || range.to() == null) {
                continue;
            }
            for (long recordNumber = range.from(); recordNumber <= range.to(); recordNumber++) {
                indexes.add(recordNumber - 1);
            }
        }
        return new ArrayList<>(indexes);
    }

    private Map<String, Object> correctiveConfig(Map<String, Object> original,
                                                 Mt101FragmentRepository.SetMetadata metadata,
                                                 String connectionRef,
                                                 String correctiveSetId,
                                                 List<Long> recordIndexIn) {
        // Copia integra del config original (envelope, sequenceA, transactionMappings,
        // format, limites...) y solo overridea el scoping. Asi el set correctivo produce
        // MT101 identicos a los originales salvo por las filas reconstruidas.
        var config = new LinkedHashMap<>(original);
        // Standalone (sin taskOutputs del motor): se resuelve por `source`, no por input.
        config.remove("input");
        // fragmentSetId literal (sin placeholders) -> el build lo usa tal cual.
        config.put("fragmentSetIdTemplate", correctiveSetId);
        config.put("replaceExisting", true);

        var source = original.get("source") instanceof Map<?, ?> originalSource
                ? new LinkedHashMap<String, Object>(asStringKeyed(originalSource))
                : new LinkedHashMap<String, Object>();
        source.put("table", metadata.sourceTable());
        // Solo process_execution_id + record_index IN: las filas de staging llevan el
        // task_definition_id del DB_WRITE (no el del BUILD que guarda el fragmento), y
        // record_index es unico por ejecucion, asi que esto pinpointea las filas corregidas.
        source.put("processExecutionId", metadata.processExecutionId());
        source.remove("taskDefinitionId");
        if (connectionRef != null && !connectionRef.isBlank()) {
            source.put("connectionRef", connectionRef);
        }
        source.put("recordIndexIn", recordIndexIn);
        config.put("source", source);
        return config;
    }

    private Map<String, Object> asStringKeyed(Map<?, ?> raw) {
        var result = new LinkedHashMap<String, Object>();
        raw.forEach((key, value) -> result.put(String.valueOf(key), value));
        return result;
    }

    private String require(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return value.trim();
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    public record RebuildResult(
            String correctiveSetId,
            int fragmentCount,
            int rebuiltRows,
            int supersededFragments,
            int resolvedQuarantine
    ) {
    }
}
