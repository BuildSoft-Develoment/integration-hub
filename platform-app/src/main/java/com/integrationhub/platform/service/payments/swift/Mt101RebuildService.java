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
    /** Claves del config original que dan forma al MT101 (se conservan en el correctivo). */
    private static final List<String> SHAPE_KEYS = List.of(
            "sequenceA", "transactionMappings", "format",
            "maxTransactionsPerMessage", "maxBytesPerMessage");

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
            var failed = failedRecordRepository.findBySet(dataSource, set, "QUARANTINED", MAX_QUARANTINE);
            var recordNumbers = failed.stream()
                    .map(Mt101FailedRecordRepository.FailedRecord::sourceRecordNumber)
                    .filter(n -> n != null)
                    .distinct()
                    .sorted()
                    .toList();
            if (recordNumbers.isEmpty()) {
                // Sin fallback: si no hay filas con numero de fila exacto, no se hace
                // un rebuild vacio silencioso.
                throw new IllegalArgumentException("no quarantined rows with an exact source row to rebuild in set " + set);
            }
            var references = new ArrayList<String>();
            for (var row : failed) {
                if (row.sendersReference() != null && !row.sendersReference().isBlank()
                        && !references.contains(row.sendersReference())) {
                    references.add(row.sendersReference());
                }
            }

            var metadata = fragmentRepository.findSetMetadata(dataSource, set);
            if (metadata == null || metadata.taskDefinitionId() == null) {
                throw new IllegalArgumentException("cannot resolve build metadata for fragment set " + set);
            }

            var config = correctiveConfig(
                    buildConfigSource.buildConfig(metadata.taskDefinitionId()),
                    metadata, connectionRef, corrective, recordNumbers);

            var context = new TaskContext(metadata.processExecutionId(), metadata.taskDefinitionId());
            var result = buildProvider.execute(context, config);
            if (!result.success()) {
                throw new IllegalStateException("corrective MT101 build failed for set " + corrective
                        + ": " + result.details());
            }
            var fragmentCount = result.outputs().get("fragmentCount") instanceof Number n ? n.intValue() : 0;

            var superseded = fragmentRepository.markSupersededByReferences(dataSource, set, references, corrective);
            var resolved = failedRecordRepository.updateStatusBySet(dataSource, set, "QUARANTINED", "REBUILT");

            return new RebuildResult(corrective, fragmentCount, recordNumbers.size(), superseded, resolved);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot rebuild MT101 quarantine for set " + set, error);
        }
    }

    private Map<String, Object> correctiveConfig(Map<String, Object> original,
                                                 Mt101FragmentRepository.SetMetadata metadata,
                                                 String connectionRef,
                                                 String correctiveSetId,
                                                 List<Long> recordNumbers) {
        var config = new LinkedHashMap<String, Object>();
        for (var key : SHAPE_KEYS) {
            if (original.get(key) != null) {
                config.put(key, original.get(key));
            }
        }
        // fragmentSetId literal (sin placeholders) -> el build lo usa tal cual.
        config.put("fragmentSetIdTemplate", correctiveSetId);
        config.put("replaceExisting", true);

        // record_index es 0-based; el numero de fila de cuarentena es 1-based.
        var recordIndexIn = new ArrayList<Long>(recordNumbers.size());
        for (var recordNumber : recordNumbers) {
            recordIndexIn.add(recordNumber - 1);
        }
        var source = new LinkedHashMap<String, Object>();
        source.put("table", metadata.sourceTable());
        // Solo process_execution_id + record_index IN: las filas de staging llevan el
        // task_definition_id del DB_WRITE (no el del BUILD que guarda el fragmento), y
        // record_index es unico por ejecucion, asi que esto pinpointea las filas corregidas.
        source.put("processExecutionId", metadata.processExecutionId());
        if (connectionRef != null && !connectionRef.isBlank()) {
            source.put("connectionRef", connectionRef);
        }
        source.put("recordIndexIn", recordIndexIn);
        config.put("source", source);
        return config;
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
