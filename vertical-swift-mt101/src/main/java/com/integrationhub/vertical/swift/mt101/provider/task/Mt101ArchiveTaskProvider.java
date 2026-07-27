package com.integrationhub.vertical.swift.mt101.provider.task;



import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.vertical.swift.mt101.provider.archive.AesGcmPayloadEncryptor;
import com.integrationhub.vertical.swift.mt101.provider.archive.PayloadEncryptor;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import com.integrationhub.vertical.swift.mt101.repository.Mt101ArchiveRepository;
import com.integrationhub.platform.spi.engine.JdbcConnectionResolver;
import com.integrationhub.platform.spi.engine.RecordAuditEmitter;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Task provider {@code MT101_ARCHIVE}: persiste cada {@link Mt101Message} de la
 * tarea anterior como envelope + archive + transactions en la BD configurada via
 * {@code connectionRef}. Calcula hash SHA-256 del {@code rawPayload} y opcionalmente
 * lo cifra (AES-GCM 256) si {@code encryptColumn}+{@code encryptionSecretRef} estan
 * configurados.
 *
 * <p>Output publica el {@code archiveId} por mensaje (clave para {@code MT101_PAY}).</p>
 *
 * @trace spec 008-mensajeria-pagos RF-003, RF-014, RF-021, T-008, T-020
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101ArchiveTaskProvider implements TaskProvider {

    private static final String DEFAULT_TABLE = "mt101_archive";
    private static final int DEFAULT_RETENTION_DAYS = 3650;
    /** Muestra de records en el output; archivedCount es siempre exacto. */
    private static final int DEFAULT_MAX_RECORDS_IN_OUTPUT = 1000;

    private final DataSource defaultDataSource;
    private final JdbcConnectionResolver connectionPoolManager;
    private final Mt101FragmentStore fragmentStore;
    private final Mt101ArchiveRepository archiveRepository;
    private final RecordAuditEmitter recordAuditEmitter;

    @Inject
    public Mt101ArchiveTaskProvider(DataSource defaultDataSource,
                                    JdbcConnectionResolver connectionPoolManager,
                                    Mt101FragmentStore fragmentStore,
                                    Mt101ArchiveRepository archiveRepository,
                                    RecordAuditEmitter recordAuditEmitter) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.fragmentStore = fragmentStore;
        this.archiveRepository = archiveRepository;
        this.recordAuditEmitter = recordAuditEmitter;
    }

    public Mt101ArchiveTaskProvider(DataSource defaultDataSource,
                                    JdbcConnectionResolver connectionPoolManager,
                                    Mt101FragmentStore fragmentStore,
                                    Mt101ArchiveRepository archiveRepository) {
        this(defaultDataSource, connectionPoolManager, fragmentStore, archiveRepository, null);
    }

    public Mt101ArchiveTaskProvider(DataSource defaultDataSource,
                                    JdbcConnectionResolver connectionPoolManager,
                                    Mt101FragmentStore fragmentStore) {
        this(defaultDataSource, connectionPoolManager, fragmentStore, new Mt101ArchiveRepository(), null);
    }

    public Mt101ArchiveTaskProvider(DataSource defaultDataSource,
                                    JdbcConnectionResolver connectionPoolManager) {
        this(defaultDataSource, connectionPoolManager, null);
    }

    @Override
    public String type() {
        return "MT101_ARCHIVE";
    }

    /** Trama RECORD de archivado por fragmento (traceId=ejecucion, recordId=:20:). */
    private AuditEnvelope recordEnvelope(TaskContext context, String reference) {
        return new AuditEnvelope(
                UUID.randomUUID().toString(),
                context.processExecutionId() == null ? null : "exec-" + context.processExecutionId(),
                reference,
                AuditLevel.RECORD,
                "RECORD_ARCHIVED",
                "ARCHIVED",
                context.processExecutionId(),
                context.taskDefinitionId(),
                null,
                null,
                Map.of(),
                "SWIFT",
                "MT101",
                null,
                null,
                null,
                null,
                null,
                reference,
                null,
                null,
                null,
                null,
                Instant.now(),
                AuditEnvelope.CURRENT_SCHEMA_VERSION);
    }

    private void emitRecordAudit(List<AuditEnvelope> envelopes) {
        if (recordAuditEmitter != null && !envelopes.isEmpty()) {
            recordAuditEmitter.emitRecords(envelopes);
        }
    }

    /**
     * Gate de estados: por defecto ARCHIVE consume SOLO fragmentos
     * {@code VALIDATED}. Un pipeline mal configurado que salte
     * {@code MT101_VALIDATE} no debe poder archivar (y por tanto enviar)
     * mensajes sin validar — flujo seguro: BUILT -> VALIDATED -> ARCHIVED ->
     * SENT. Archivar {@code BUILT} directo requiere fijar
     * {@code fragmentSource.statuses} explicitamente (decision consciente,
     * no accidente de configuracion).
     */
    private static final java.util.List<String> FRAGMENT_READ_STATUSES = java.util.List.of("VALIDATED");

    @Override
    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var fragmentSource = Mt101MessageInputResolver.fragmentSource(context, configuration, type());

        var connectionRef = stringValue(configuration.get("connectionRef"), null);
        var dataSource = resolveDataSource(connectionRef);
        var encryptor = resolveEncryptor(configuration);
        var retentionDays = intValue(configuration.get("retentionDays"), DEFAULT_RETENTION_DAYS);

        var accumulator = new ArchiveAccumulator(
                intValue(configuration.get("maxRecordsInOutput"), DEFAULT_MAX_RECORDS_IN_OUTPUT));
        if (!fragmentSource.isEmpty() && fragmentStore != null) {
            // Flujo masivo: una transaccion por pagina (un fragmento fallido
            // revierte solo su pagina) y entradas SIN el Mt101Message embebido:
            // PAY lee del fragment store, no de los outputs, y retener 10k+
            // mensajes en outputs anula la ganancia de memoria de la paginacion.
            var pageSize = intValue(configuration.get("pageSize"), Mt101FragmentStore.DEFAULT_PAGE_SIZE);
            fragmentStore.forEachPage(fragmentSource, FRAGMENT_READ_STATUSES, pageSize, page -> {
                archiveBatch(dataSource, encryptor, retentionDays, context, connectionRef,
                        page, false, accumulator);
                // Marcado por lote: 1 round-trip por pagina en vez de 1 UPDATE
                // por fragmento.
                var archivedRefs = new ArrayList<String>(page.size());
                var pageAudit = new ArrayList<AuditEnvelope>(page.size());
                for (var message : page) {
                    if (message.sequenceA() != null && message.sequenceA().sendersReference() != null) {
                        var reference = message.sequenceA().sendersReference();
                        archivedRefs.add(reference);
                        pageAudit.add(recordEnvelope(context, reference));
                    }
                }
                fragmentStore.markStatusBatch(fragmentSource, archivedRefs, "ARCHIVED");
                emitRecordAudit(pageAudit);
            });
        } else {
            var messages = Mt101MessageInputResolver.readMessages(context, configuration, type(), fragmentStore);
            if (!messages.isEmpty()) {
                archiveBatch(dataSource, encryptor, retentionDays, context, connectionRef,
                        messages, true, accumulator);
                var audit = new ArrayList<AuditEnvelope>(messages.size());
                for (var message : messages) {
                    if (message.sequenceA() != null && message.sequenceA().sendersReference() != null) {
                        audit.add(recordEnvelope(context, message.sequenceA().sendersReference()));
                    }
                }
                emitRecordAudit(audit);
            }
        }

        if (accumulator.archivedCount == 0) {
            return TaskResult.success("MT101_ARCHIVE skipped because there are no messages to archive");
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("archivedCount", accumulator.archivedCount);
        outputs.put("totalBytes", accumulator.totalBytes);
        outputs.put("targetTable", DEFAULT_TABLE);
        // records es una MUESTRA acotada (maxRecordsInOutput); el detalle completo
        // esta en mt101_archive / mt101_build_fragment.
        outputs.put("records", accumulator.archived);
        outputs.put("recordsSampled", accumulator.archivedCount > accumulator.archived.size());
        if (!fragmentSource.isEmpty()) {
            outputs.put("fragments", fragmentSource);
        }

        return TaskResult.success(
                "MT101_ARCHIVE archived " + accumulator.archivedCount
                        + " messages (" + accumulator.totalBytes + " bytes)",
                outputs);
    }

    private void archiveBatch(DataSource dataSource,
                              PayloadEncryptor encryptor,
                              int retentionDays,
                              TaskContext context,
                              String connectionRef,
                              java.util.List<Mt101Message> messages,
                              boolean includeMessageInEntry,
                              ArchiveAccumulator accumulator) {
        try (Connection connection = dataSource.getConnection()) {
            var previousAutoCommit = connection.getAutoCommit();
            connection.setAutoCommit(false);
            try {
                for (var message : messages) {
                    var raw = message.rawPayload();
                    if (raw == null) {
                        throw new IllegalStateException("Mt101Message.rawPayload is required for archiving");
                    }
                    accumulator.totalBytes += raw.getBytes(StandardCharsets.UTF_8).length;
                    var stored = encryptor != null ? encryptor.encrypt(raw) : raw;
                    var hash = sha256Hex(raw);

                    var insert = archiveRepository.insertArchivedMessage(connection, message,
                            context.processExecutionId(), stored, hash, retentionDays);

                    var entry = new LinkedHashMap<String, Object>();
                    entry.put("archiveId", insert.archiveId());
                    entry.put("envelopeId", insert.envelopeId());
                    entry.put("sendersReference", message.sequenceA() == null ? null
                            : message.sequenceA().sendersReference());
                    if (connectionRef != null && !connectionRef.isBlank()) {
                        entry.put("connectionRef", connectionRef);
                    }
                    entry.put("hash", hash);
                    entry.put("encrypted", encryptor != null);
                    if (includeMessageInEntry) {
                        entry.put("message", message);
                    }
                    accumulator.add(entry);
                }
                connection.commit();
            } catch (SQLException | RuntimeException error) {
                try {
                    connection.rollback();
                } catch (SQLException rollbackError) {
                    error.addSuppressed(rollbackError);
                }
                throw error;
            } finally {
                connection.setAutoCommit(previousAutoCommit);
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot archive MT101 messages", error);
        }
    }

    /** Acumula archivo con sample acotado (memoria O(maxRecords)); conteo exacto. */
    private static final class ArchiveAccumulator {
        final ArrayList<Map<String, Object>> archived = new ArrayList<>();
        final int maxRecordsInOutput;
        int archivedCount;
        long totalBytes;

        ArchiveAccumulator(int maxRecordsInOutput) {
            this.maxRecordsInOutput = Math.max(maxRecordsInOutput, 0);
        }

        void add(Map<String, Object> entry) {
            archivedCount++;
            if (archived.size() < maxRecordsInOutput) {
                archived.add(entry);
            }
        }
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    /**
     * Construye el encryptor si la configuracion lo solicita. La clave
     * ({@code encryptionSecretRef}) llega ya resuelta por
     * {@code JsonConfigurationMapper.toMap} (que expande {@code ${secret:...}} antes
     * de invocar al provider). Por eso aqui no se inyecta {@code SecretValueProvider}:
     * lo que recibimos es el material de clave en claro.
     */
    private PayloadEncryptor resolveEncryptor(Map<String, Object> configuration) {
        var encryptColumn = stringValue(configuration.get("encryptColumn"), null);
        var keyMaterial = stringValue(configuration.get("encryptionSecretRef"), null);
        if (encryptColumn == null || keyMaterial == null) {
            return null;
        }
        if (keyMaterial.startsWith("${")) {
            throw new IllegalStateException(
                    "encryptionSecretRef llegó sin resolver: '" + keyMaterial
                            + "'. La configuración debe pasar por JsonConfigurationMapper.toMap() "
                            + "para expandir ${secret:...} antes de invocar al provider.");
        }
        return new AesGcmPayloadEncryptor(keyMaterial);
    }

    private String sha256Hex(String input) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 not available", error);
        }
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(raw));
    }
}
