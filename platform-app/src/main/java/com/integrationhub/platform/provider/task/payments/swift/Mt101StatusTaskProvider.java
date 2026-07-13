package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.repository.payments.swift.Mt101ConfirmationRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101RebuildRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.service.execution.RecordAuditEmitter;
import com.integrationhub.platform.service.payments.swift.Mt101PayUncertainResolutionService;
import com.integrationhub.platform.spi.task.AsyncOffloadSupport;
import com.integrationhub.platform.spi.task.SuspendableTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.net.http.HttpClient;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.time.Instant;
import java.util.UUID;

/**
 * Task provider {@code MT101_STATUS}: consulta/recibe el estado de mensajes
 * enviados al gateway y persiste la confirmacion a {@code mt101_confirmation}.
 *
 * <p><b>Primer consumidor productivo del SPI M-2</b>
 * ({@link SuspendableTaskProvider}, T-017 spec 003). Modos:</p>
 * <ul>
 *   <li>{@code query}: GET HTTP por mensaje, single-shot (sin suspension).
 *       Tipico bajo scheduler de spec 006.</li>
 *   <li>{@code callback}: la tarea se suspende esperando el push del gateway
 *       (MT900/MT910, pacs.002, JSON propietario). El banco invoca
 *       {@code POST /api/process-executions/resume/{token}} con body
 *       {@code {"confirmations":[{"sendersReference":"P1","status":"ACCP",
 *       "gatewayReference":"GW-1","raw":"..."}]}}. El resume persiste las
 *       confirmaciones y re-suspende (nuevo token) si quedan pendientes,
 *       salvo {@code callback.completeOnPartial=true}.</li>
 *   <li>{@code poll}: primera consulta en {@code execute}; lo no-final queda
 *       suspendido. Cada resume (scheduler periodico o POST manual sin body)
 *       re-consulta los pendientes. Termina success cuando todos alcanzan un
 *       estado de {@code poll.finalStatuses} (default ACCEPTED/REJECTED), o
 *       failure al agotar {@code poll.maxAttempts} (default 10).</li>
 * </ul>
 *
 * <p><b>Configuracion</b> (query/poll comparten {@code query.*} y
 * {@code expectedGatewayResponse.*}):</p>
 * <pre>{@code
 * {
 *   "mode": "query" | "callback" | "poll",
 *   "input": { "sourceTaskRef": "pay-mt101", "sourceOutput": "records" },
 *   "query": { "url": "https://gw/st/${gatewayReference}", "method": "GET", "timeoutSeconds": 30 },
 *   "expectedGatewayResponse": { "statusField": "$.status", "referenceField": "$.gatewayReference" },
 *   "poll": { "finalStatuses": ["ACCEPTED", "REJECTED"], "maxAttempts": 10 },
 *   "callback": { "completeOnPartial": false },
 *   "connectionRef": "12",
 *   "confirmationTable": "mt101_confirmation",
 *   "resolveNormalPay": false,
 *   "fragmentSetId": "SET-123"
 * }
 * }</pre>
 *
 * <p><b>Reconciliacion automatica del PAY normal</b> (v59-item4): con {@code resolveNormalPay=true} (mode=query) la
 * tarea resuelve dentro del flujo automatico el {@code UNCERTAIN} del PAY normal ({@code mt101_build_fragment}),
 * espejo del {@code resolveCorrectivePay} del ledger. Delega en {@code Mt101PayUncertainResolutionService}: consulta
 * STATUS, transiciona a {@code SENT}/{@code REJECTED} (atomico con su confirmacion) y marca {@code pay_conflict} +
 * trama {@code PAY_CONFLICT} en las contradicciones {@code SENT}->banco-{@code REJECTED}. Nunca reenvia. El
 * {@code fragmentSetId} es explicito en la config o se deriva del output {@code fragmentSetId} del build upstream
 * (via {@code input.sourceTaskRef}); {@code executedBy}/{@code reason} son opcionales (defaults del sistema).</p>
 *
 * <p>El {@code suspendedState} es JSON-friendly: {@code {mode, pending[], attempt}}
 * donde cada pending es el record original (sendersReference, gatewayReference,
 * archiveId, ...) necesario para re-templear la URL o casar el callback.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-005, RF-019, T-013
 * @trace spec 003 T-017 (M-2), ADR-009
 */
@ApplicationScoped
public class Mt101StatusTaskProvider implements SuspendableTaskProvider {

    private static final int DEFAULT_TIMEOUT_SECONDS = 30;
    private static final String DEFAULT_CONFIRMATION_TABLE = "mt101_confirmation";
    private static final String DEFAULT_STATUS_PATH = "$.status";
    private static final String DEFAULT_REFERENCE_PATH = "$.gatewayReference";
    private static final int DEFAULT_POLL_MAX_ATTEMPTS = 10;
    private static final int DEFAULT_POLL_INTERVAL_SECONDS = 300;
    private static final List<String> DEFAULT_FINAL_STATUSES = List.of("ACCEPTED", "REJECTED");

    private static final List<String> DEFAULT_ACCEPTED_STATUSES =
            List.of("ACCEPTED", "CONFIRMED", "SETTLED", "ACSC", "ACCP");
    private static final List<String> DEFAULT_REJECTED_STATUSES =
            List.of("REJECTED", "FAILED", "DECLINED", "RJCT");
    /** Muestra de records/errors en el output; los conteos son siempre exactos. */
    private static final int DEFAULT_MAX_RECORDS_IN_OUTPUT = 1000;
    /** Flush de confirmaciones a BD cada N para no retener todos los rawBody. */
    private static final int PERSIST_BATCH_SIZE = 500;
    /** Actor por defecto de la reconciliacion automatica de PAY normal (accion del sistema, no maker humano). */
    private static final String DEFAULT_NORMAL_PAY_ACTOR = "MT101_STATUS";
    /** Motivo por defecto de la reconciliacion automatica de PAY normal. */
    private static final String DEFAULT_NORMAL_PAY_REASON = "automatic reconciliation by MT101_STATUS";

    private final ObjectMapper objectMapper;
    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101ArchiveStatusUpdater archiveStatusUpdater;
    private final Mt101ConfirmationRepository confirmationRepository;
    private final Mt101RebuildRepository rebuildRepository;
    private final Mt101StatusGateway gateway;
    // v56-fix: la consulta por transporte/ruta (REST/SFTP, route-aware) vive en el ejecutor COMPARTIDO con el
    // resolver del UNCERTAIN normal (una sola copia de resolveStatusQuery + ejecucion REST/SFTP).
    private final Mt101StatusQueryExecutor statusQueryExecutor;
    private final RecordAuditEmitter recordAuditEmitter;
    // v59-item4: la reconciliacion automatica del PAY normal (UNCERTAIN->SENT/REJECTED + SENT vs banco) esta
    // encapsulada en su servicio; el flag resolveNormalPay delega en el (nullable en tests que no lo ejercitan).
    private final Mt101PayUncertainResolutionService payUncertainResolutionService;

    @Inject
    public Mt101StatusTaskProvider(ObjectMapper objectMapper,
                                   DataSource defaultDataSource,
                                   ConnectionPoolManager connectionPoolManager,
                                   Mt101ArchiveStatusUpdater archiveStatusUpdater,
                                   Mt101ConfirmationRepository confirmationRepository,
                                   Mt101RebuildRepository rebuildRepository,
                                   RecordAuditEmitter recordAuditEmitter,
                                   Mt101PayUncertainResolutionService payUncertainResolutionService) {
        this(objectMapper, HttpClient.newBuilder().build(), defaultDataSource, connectionPoolManager,
                archiveStatusUpdater, confirmationRepository, rebuildRepository, recordAuditEmitter,
                payUncertainResolutionService);
    }

    public Mt101StatusTaskProvider(ObjectMapper objectMapper,
                                   DataSource defaultDataSource,
                                   ConnectionPoolManager connectionPoolManager,
                                   Mt101ArchiveStatusUpdater archiveStatusUpdater,
                                   Mt101ConfirmationRepository confirmationRepository) {
        this(objectMapper, HttpClient.newBuilder().build(), defaultDataSource, connectionPoolManager,
                archiveStatusUpdater, confirmationRepository, new Mt101RebuildRepository(), null, null);
    }

    /** Constructor de test: permite inyectar un HttpClient custom. */
    Mt101StatusTaskProvider(ObjectMapper objectMapper,
                            HttpClient httpClient,
                            DataSource defaultDataSource,
                            ConnectionPoolManager connectionPoolManager) {
        this(objectMapper, httpClient, defaultDataSource, connectionPoolManager,
                new Mt101ArchiveStatusUpdater(defaultDataSource, connectionPoolManager),
                new Mt101ConfirmationRepository(), new Mt101RebuildRepository(), null, null);
    }

    /** Constructor de test (v59-item4): inyecta el servicio de resolucion para ejercitar {@code resolveNormalPay}. */
    Mt101StatusTaskProvider(ObjectMapper objectMapper,
                            DataSource defaultDataSource,
                            ConnectionPoolManager connectionPoolManager,
                            Mt101PayUncertainResolutionService payUncertainResolutionService) {
        this(objectMapper, HttpClient.newBuilder().build(), defaultDataSource, connectionPoolManager,
                new Mt101ArchiveStatusUpdater(defaultDataSource, connectionPoolManager),
                new Mt101ConfirmationRepository(), new Mt101RebuildRepository(), null,
                payUncertainResolutionService);
    }

    Mt101StatusTaskProvider(ObjectMapper objectMapper,
                            HttpClient httpClient,
                            DataSource defaultDataSource,
                            ConnectionPoolManager connectionPoolManager,
                            Mt101ArchiveStatusUpdater archiveStatusUpdater) {
        this(objectMapper, httpClient, defaultDataSource, connectionPoolManager,
                archiveStatusUpdater, new Mt101ConfirmationRepository(), new Mt101RebuildRepository(), null, null);
    }

    Mt101StatusTaskProvider(ObjectMapper objectMapper,
                            HttpClient httpClient,
                            DataSource defaultDataSource,
                            ConnectionPoolManager connectionPoolManager,
                            Mt101ArchiveStatusUpdater archiveStatusUpdater,
                            Mt101ConfirmationRepository confirmationRepository) {
        this(objectMapper, httpClient, defaultDataSource, connectionPoolManager,
                archiveStatusUpdater, confirmationRepository, new Mt101RebuildRepository(), null, null);
    }

    Mt101StatusTaskProvider(ObjectMapper objectMapper,
                            HttpClient httpClient,
                            DataSource defaultDataSource,
                            ConnectionPoolManager connectionPoolManager,
                            Mt101ArchiveStatusUpdater archiveStatusUpdater,
                            Mt101ConfirmationRepository confirmationRepository,
                            Mt101RebuildRepository rebuildRepository,
                            RecordAuditEmitter recordAuditEmitter,
                            Mt101PayUncertainResolutionService payUncertainResolutionService) {
        this.objectMapper = objectMapper;
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.archiveStatusUpdater = archiveStatusUpdater;
        this.confirmationRepository = confirmationRepository;
        this.rebuildRepository = rebuildRepository == null ? new Mt101RebuildRepository() : rebuildRepository;
        this.gateway = new Mt101StatusGateway(httpClient, objectMapper);
        this.statusQueryExecutor = new Mt101StatusQueryExecutor(gateway, new Mt101StatusSftpGateway());
        this.recordAuditEmitter = recordAuditEmitter;
        this.payUncertainResolutionService = payUncertainResolutionService;
    }

    @Override
    public String type() {
        return "MT101_STATUS";
    }

    /**
     * <b>SUPPORTED</b> (Nivel 3, ADR-015): offloadable en {@code once}. Lee {@code taskOutputs} (qué pagos
     * consultar), que el consumer rehidrata desde la continuación persistida; y si suspende esperando el
     * callback/poll del gateway, el motor la re-suspende (no la mata). No usa {@code sourcePayload}.
     */
    @Override
    public AsyncOffloadSupport asyncOffloadSupport() {
        return AsyncOffloadSupport.SUPPORTED;
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var mode = stringValue(configuration.get("mode"), "query").toLowerCase(Locale.ROOT);
        return switch (mode) {
            case "query" -> executeQuery(context, configuration);
            case "callback" -> suspendForCallback(context, configuration);
            case "poll" -> pollRound(context, configuration, readRecords(context, configuration), 0);
            default -> throw new IllegalArgumentException(
                    "Unsupported MT101_STATUS mode '" + mode + "'; expected query, callback or poll");
        };
    }

    @Override
    public TaskResult resume(TaskContext context,
                             Map<String, Object> configuration,
                             Map<String, Object> suspendedState) {
        var mode = stringValue(suspendedState.get("mode"), "").toLowerCase(Locale.ROOT);
        return switch (mode) {
            case "callback" -> resumeCallback(context, configuration, suspendedState);
            case "poll" -> pollRound(context, configuration, pendingFromState(suspendedState),
                    intValue(suspendedState.get("attempt"), 0));
            default -> throw new IllegalStateException(
                    "MT101_STATUS cannot resume: suspendedState.mode is '" + mode + "'");
        };
    }

    // ------------------------------------------------------------------
    // mode=callback
    // ------------------------------------------------------------------

    private TaskResult suspendForCallback(TaskContext context, Map<String, Object> configuration) {
        var records = readRecords(context, configuration);
        if (records.isEmpty()) {
            return TaskResult.success("MT101_STATUS skipped because there are no messages to confirm");
        }
        var state = new LinkedHashMap<String, Object>();
        state.put("mode", "callback");
        state.put("pending", records);
        return TaskResult.suspended(
                "MT101_STATUS waiting for gateway callback (" + records.size() + " pending)", state);
    }

    private TaskResult resumeCallback(TaskContext context, Map<String, Object> configuration, Map<String, Object> suspendedState) {
        var pending = pendingFromState(suspendedState);
        var confirmations = callbackConfirmations(suspendedState);
        if (confirmations.isEmpty()) {
            // Callback vacio o malformado: seguimos esperando (re-suspension con
            // los mismos pendientes; el caller recibe un nuevo token).
            var state = new LinkedHashMap<String, Object>();
            state.put("mode", "callback");
            state.put("pending", pending);
            return TaskResult.suspended("MT101_STATUS callback contained no confirmations; still waiting ("
                    + pending.size() + " pending)", state);
        }

        var matched = new ArrayList<ConfirmationRow>();
        var matchedEntries = new ArrayList<Map<String, Object>>();
        var byStatus = new TreeMap<String, Integer>();
        var remaining = new ArrayList<Map<String, Object>>(pending);
        for (var confirmation : confirmations) {
            var sendersReference = stringOrNull(confirmation.get("sendersReference"));
            var gatewayReference = stringOrNull(confirmation.get("gatewayReference"));
            var record = removeMatching(remaining, sendersReference, gatewayReference);
            if (record == null) {
                continue; // confirmacion de algo que no esta pendiente: la ignoramos
            }
            var status = stringValue(confirmation.get("status"), "UNKNOWN");
            var raw = stringOrNull(confirmation.get("raw"));
            matched.add(new ConfirmationRow(readArchiveId(record), "CALLBACK",
                    gatewayReference != null ? gatewayReference
                            : stringOrNull(record.get("gatewayReference")),
                    status, raw));
            var entry = new LinkedHashMap<String, Object>();
            entry.put("sendersReference", sendersReference != null ? sendersReference
                    : record.get("sendersReference"));
            entry.put("gatewayReference", gatewayReference != null ? gatewayReference
                    : record.get("gatewayReference"));
            entry.put("status", status);
            matchedEntries.add(entry);
            byStatus.merge(status, 1, Integer::sum);
        }

        persistConfirmations(context, configuration, matched, matchedEntries);

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("confirmedCount", matchedEntries.size());
        outputs.put("pendingCount", remaining.size());
        outputs.put("countByStatus", byStatus);
        outputs.put("records", matchedEntries);

        if (remaining.isEmpty()) {
            return TaskResult.success("MT101_STATUS callback confirmed all "
                    + matchedEntries.size() + " messages", outputs);
        }
        if (boolValue(callbackConfig(configuration).get("completeOnPartial"), false)) {
            return TaskResult.success("MT101_STATUS callback confirmed " + matchedEntries.size()
                    + " messages; " + remaining.size() + " left unconfirmed (completeOnPartial)", outputs);
        }
        var state = new LinkedHashMap<String, Object>();
        state.put("mode", "callback");
        state.put("pending", remaining);
        return TaskResult.suspended("MT101_STATUS confirmed " + matchedEntries.size()
                + ", still waiting for " + remaining.size() + " messages", state);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> callbackConfirmations(Map<String, Object> suspendedState) {
        if (!(suspendedState.get("externalEvent") instanceof Map<?, ?> event)) {
            return List.of();
        }
        if (!(event.get("confirmations") instanceof List<?> rawList)) {
            return List.of();
        }
        var result = new ArrayList<Map<String, Object>>(rawList.size());
        for (var item : rawList) {
            if (item instanceof Map<?, ?> map) {
                var entry = new LinkedHashMap<String, Object>();
                map.forEach((key, value) -> entry.put(String.valueOf(key), value));
                result.add(entry);
            }
        }
        return result;
    }

    private Map<String, Object> removeMatching(List<Map<String, Object>> remaining,
                                               String sendersReference,
                                               String gatewayReference) {
        for (var iterator = remaining.iterator(); iterator.hasNext(); ) {
            var record = iterator.next();
            var recordSenders = stringOrNull(record.get("sendersReference"));
            var recordGateway = stringOrNull(record.get("gatewayReference"));
            var matchesSenders = sendersReference != null && sendersReference.equals(recordSenders);
            var matchesGateway = gatewayReference != null && gatewayReference.equals(recordGateway);
            if (matchesSenders || matchesGateway) {
                iterator.remove();
                return record;
            }
        }
        return null;
    }

    // ------------------------------------------------------------------
    // mode=poll
    // ------------------------------------------------------------------

    private TaskResult pollRound(TaskContext context,
                                 Map<String, Object> configuration,
                                 List<Map<String, Object>> pending,
                                 int previousAttempts) {
        if (pending.isEmpty()) {
            return TaskResult.success("MT101_STATUS skipped because there are no messages to poll");
        }
        var queryCfg = mapValue(configuration.get("query"));
        var urlTemplate = stringRequired(queryCfg.get("url"), "query.url");
        var httpMethod = stringValue(queryCfg.get("method"), "GET").toUpperCase(Locale.ROOT);
        var timeoutSeconds = intValue(queryCfg.get("timeoutSeconds"), DEFAULT_TIMEOUT_SECONDS);
        var expected = mapValue(configuration.get("expectedGatewayResponse"));
        var statusPath = stringValue(expected.get("statusField"), DEFAULT_STATUS_PATH);
        var pollCfg = mapValue(configuration.get("poll"));
        var finalStatuses = finalStatuses(pollCfg.get("finalStatuses"));
        var maxAttempts = intValue(pollCfg.get("maxAttempts"), DEFAULT_POLL_MAX_ATTEMPTS);

        var confirmed = new ArrayList<ConfirmationRow>();
        var confirmedEntries = new ArrayList<Map<String, Object>>();
        var byStatus = new TreeMap<String, Integer>();
        var stillPending = new ArrayList<Map<String, Object>>();
        var errors = new ArrayList<Map<String, Object>>();

        for (var record : pending) {
            var url = resolveTemplate(urlTemplate, record);
            var queryResult = gateway.query(httpMethod, url, timeoutSeconds);
            if (queryResult.error() != null) {
                stillPending.add(record);
                var entry = new LinkedHashMap<String, Object>();
                entry.put("sendersReference", record.get("sendersReference"));
                entry.put("gatewayReference", record.get("gatewayReference"));
                entry.put("error", queryResult.error());
                errors.add(entry);
                continue;
            }
            var status = gateway.extractField(queryResult.body(), statusPath);
            if (status != null && finalStatuses.contains(status.toUpperCase(Locale.ROOT))) {
                confirmed.add(new ConfirmationRow(readArchiveId(record), "POLL",
                        stringOrNull(record.get("gatewayReference")), status, queryResult.body()));
                var entry = new LinkedHashMap<String, Object>();
                entry.put("sendersReference", record.get("sendersReference"));
                entry.put("gatewayReference", record.get("gatewayReference"));
                entry.put("status", status);
                confirmedEntries.add(entry);
                byStatus.merge(status, 1, Integer::sum);
            } else {
                stillPending.add(record);
            }
        }

        persistConfirmations(context, configuration, confirmed, confirmedEntries);

        var attempt = previousAttempts + 1;
        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("confirmedCount", confirmedEntries.size());
        outputs.put("pendingCount", stillPending.size());
        outputs.put("attempt", attempt);
        outputs.put("countByStatus", byStatus);
        outputs.put("records", confirmedEntries);
        outputs.put("errors", errors);

        if (stillPending.isEmpty()) {
            return TaskResult.success("MT101_STATUS poll confirmed all messages on attempt "
                    + attempt, outputs);
        }
        if (attempt >= maxAttempts) {
            return TaskResult.failure("MT101_STATUS poll exhausted " + maxAttempts
                    + " attempts with " + stillPending.size() + " messages unconfirmed", outputs);
        }
        var state = new LinkedHashMap<String, Object>();
        state.put("mode", "poll");
        state.put("attempt", attempt);
        state.put("pending", stillPending);
        // Auto-despertar (SuspensionExpiryScheduler): el engine fija
        // suspend_expires_at = now + intervalSeconds y re-invoca resume al vencer.
        state.put("_resumeAfterSeconds", intValue(pollCfg.get("intervalSeconds"), DEFAULT_POLL_INTERVAL_SECONDS));
        return TaskResult.suspended("MT101_STATUS poll attempt " + attempt + "/" + maxAttempts
                + ": " + stillPending.size() + " messages still pending", state);
    }

    private List<String> finalStatuses(Object raw) {
        if (!(raw instanceof List<?> rawList) || rawList.isEmpty()) {
            return DEFAULT_FINAL_STATUSES;
        }
        var result = new ArrayList<String>(rawList.size());
        for (var item : rawList) {
            result.add(String.valueOf(item).toUpperCase(Locale.ROOT));
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> pendingFromState(Map<String, Object> suspendedState) {
        if (!(suspendedState.get("pending") instanceof List<?> rawList)) {
            return List.of();
        }
        var result = new ArrayList<Map<String, Object>>(rawList.size());
        for (var item : rawList) {
            if (item instanceof Map<?, ?> map) {
                var entry = new LinkedHashMap<String, Object>();
                map.forEach((key, value) -> entry.put(String.valueOf(key), value));
                result.add(entry);
            }
        }
        return result;
    }

    // ------------------------------------------------------------------
    // mode=query (single-shot, comportamiento original)
    // ------------------------------------------------------------------

    private TaskResult executeQuery(TaskContext context, Map<String, Object> configuration) {
        // v59-item4: reconciliacion automatica del PAY normal. Opt-in explicito (resolveNormalPay=true), espejo del
        // resolveCorrectivePay del ledger. Delega en el servicio (atomico + trama PAY_CONFLICT + visible), sin
        // reimplementar la logica de consulta/resolucion aqui (SRP/DIP). No coexiste con el correctivo.
        if (boolValue(configuration.get("resolveNormalPay"), false)) {
            return resolveNormalPay(context, configuration);
        }
        var corrective = correctivePaySource(context, configuration);
        if (!corrective.isEmpty()) {
            return executeCorrectiveQuery(context, configuration, corrective);
        }
        var records = readRecords(context, configuration);
        if (records.isEmpty()) {
            return TaskResult.success("MT101_STATUS skipped because there are no messages to query");
        }

        var queryCfg = mapValue(configuration.get("query"));
        var urlTemplate = stringRequired(queryCfg.get("url"), "query.url");
        var httpMethod = stringValue(queryCfg.get("method"), "GET").toUpperCase(Locale.ROOT);
        var timeoutSeconds = intValue(queryCfg.get("timeoutSeconds"), DEFAULT_TIMEOUT_SECONDS);
        var expected = mapValue(configuration.get("expectedGatewayResponse"));
        var statusPath = stringValue(expected.get("statusField"), DEFAULT_STATUS_PATH);
        var referencePath = stringValue(expected.get("referenceField"), DEFAULT_REFERENCE_PATH);

        var maxRecordsInOutput = intValue(configuration.get("maxRecordsInOutput"), DEFAULT_MAX_RECORDS_IN_OUTPUT);
        // Muestras acotadas para el output; conteos exactos.
        var confirmations = new ArrayList<Map<String, Object>>();
        var errors = new ArrayList<Map<String, Object>>();
        var byStatus = new TreeMap<String, Integer>();
        // Buffer de filas a persistir, flush por lotes para no retener todos los
        // rawBody (KB c/u) en memoria.
        var pendingRows = new ArrayList<ConfirmationRow>(PERSIST_BATCH_SIZE);
        var pendingAuditEntries = new ArrayList<Map<String, Object>>(PERSIST_BATCH_SIZE);
        int queriedCount = 0;
        int confirmedCount = 0;
        int errorCount = 0;

        for (var record : records) {
            queriedCount++;
            var url = resolveTemplate(urlTemplate, record);
            var queryResult = gateway.query(httpMethod, url, timeoutSeconds);
            if (queryResult.error() != null) {
                errorCount++;
                byStatus.merge("ERROR", 1, Integer::sum);
                if (errors.size() < maxRecordsInOutput) {
                    var entry = new LinkedHashMap<String, Object>();
                    entry.put("sendersReference", record.get("sendersReference"));
                    entry.put("gatewayReference", record.get("gatewayReference"));
                    entry.put("status", "ERROR");
                    entry.put("error", queryResult.error());
                    errors.add(entry);
                }
                continue;
            }
            var rawBody = queryResult.body();
            var confirmedStatus = gateway.extractField(rawBody, statusPath);
            var gatewayReference = gateway.extractField(rawBody, referencePath);
            if (gatewayReference == null) {
                gatewayReference = String.valueOf(record.getOrDefault("gatewayReference", ""));
            }
            pendingRows.add(new ConfirmationRow(readArchiveId(record), "STATUS_API",
                    gatewayReference, confirmedStatus, rawBody));
            var auditEntry = new LinkedHashMap<String, Object>();
            auditEntry.put("sendersReference", record.get("sendersReference"));
            auditEntry.put("gatewayReference", gatewayReference);
            auditEntry.put("status", confirmedStatus);
            auditEntry.put("archiveId", record.get("archiveId"));
            pendingAuditEntries.add(auditEntry);
            if (pendingRows.size() >= PERSIST_BATCH_SIZE) {
                persistConfirmations(context, configuration, pendingRows, pendingAuditEntries);
                pendingRows.clear();
                pendingAuditEntries.clear();
            }
            confirmedCount++;
            byStatus.merge(confirmedStatus == null ? "UNKNOWN" : confirmedStatus, 1, Integer::sum);
            if (confirmations.size() < maxRecordsInOutput) {
                var entry = new LinkedHashMap<String, Object>();
                entry.put("sendersReference", record.get("sendersReference"));
                entry.put("gatewayReference", gatewayReference);
                entry.put("status", confirmedStatus);
                confirmations.add(entry);
            }
        }
        persistConfirmations(context, configuration, pendingRows, pendingAuditEntries);

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("queriedCount", queriedCount);
        outputs.put("confirmedCount", confirmedCount);
        outputs.put("errorCount", errorCount);
        outputs.put("countByStatus", byStatus);
        outputs.put("records", confirmations);
        outputs.put("errors", errors);
        outputs.put("recordsSampled", confirmedCount > confirmations.size() || errorCount > errors.size());

        var summary = "MT101_STATUS queried=" + queriedCount
                + " confirmed=" + confirmedCount
                + " errors=" + errorCount;
        return errorCount == 0
                ? TaskResult.success(summary, outputs)
                : TaskResult.failure(summary, outputs);
    }

    /**
     * v59-item4: reconciliacion automatica del PAY normal desde el pipeline. Cierra el hueco de que el UNCERTAIN del
     * PAY normal (mt101_build_fragment) no se resolvia dentro del flujo automatico STATUS como si lo hace el correctivo
     * (resolveCorrectivePay). Delega en {@link Mt101PayUncertainResolutionService#resolveUncertainNormalPay}, que ya es
     * atomico (transicion + confirmacion en 1 tx), emite la trama append-only {@code PAY_CONFLICT} en las
     * contradicciones SENT->banco-REJECTED y las deja visibles (API/UI). Este metodo solo enruta: obtiene el
     * {@code fragmentSetId} (explicito o derivado del output del build upstream), el actor y el motivo, y mapea el
     * resultado a outputs. Nunca reenvia (STATUS solo consulta).
     *
     * <p>Errores de gateway y conflictos NO son fallo de la tarea: los fragmentos no concluyentes se mantienen sin
     * resolver (se reintenta la proxima corrida) y los conflictos quedan para conciliacion manual. La tarea solo
     * propaga fallo si no puede leer el set (excepcion del servicio).</p>
     */
    private TaskResult resolveNormalPay(TaskContext context, Map<String, Object> configuration) {
        if (payUncertainResolutionService == null) {
            throw new IllegalStateException(
                    "MT101_STATUS resolveNormalPay requires the PAY resolution service, which is not wired");
        }
        var fragmentSetId = normalPayFragmentSetId(context, configuration);
        var connectionRef = stringOrNull(configuration.get("connectionRef"));
        var executedBy = stringValue(configuration.get("executedBy"), DEFAULT_NORMAL_PAY_ACTOR);
        var reason = stringValue(configuration.get("reason"), DEFAULT_NORMAL_PAY_REASON);

        var resolution = payUncertainResolutionService.resolveUncertainNormalPay(
                connectionRef, fragmentSetId, executedBy, reason);

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("fragmentSetId", fragmentSetId);
        outputs.put("resolvedSent", resolution.resolvedSent());
        outputs.put("resolvedRejected", resolution.resolvedRejected());
        outputs.put("stillPending", resolution.stillPending());
        outputs.put("gatewayErrors", resolution.gatewayErrors());
        outputs.put("conflicts", resolution.conflicts());

        var summary = "MT101_STATUS resolveNormalPay set=" + fragmentSetId
                + " sent=" + resolution.resolvedSent()
                + " rejected=" + resolution.resolvedRejected()
                + " pending=" + resolution.stillPending()
                + " conflicts=" + resolution.conflicts()
                + " errors=" + resolution.gatewayErrors();
        // G1 (opción B): señaliza al motor si el dinero quedó resuelto o sigue ambiguo. Todo cerrado (0 pendientes, 0
        // conflictos, 0 errores de gateway) -> resolvedReconciliation: limpia el flag y el proceso puede cerrar
        // COMPLETED. Si queda algo (pending/conflict/gatewayError -> fragmentos UNCERTAIN sin terminal) ->
        // needsReconciliation: el proceso queda NEEDS_RECONCILIATION (cubre también un STATUS ejecutado standalone).
        var fullyResolved = resolution.stillPending() == 0
                && resolution.conflicts() == 0
                && resolution.gatewayErrors() == 0;
        return fullyResolved
                ? TaskResult.resolvedReconciliation(summary, outputs)
                : TaskResult.needsReconciliation(summary, outputs);
    }

    /**
     * Resuelve el {@code fragmentSetId} a reconciliar: explicito en la config si esta declarado; si no, derivado del
     * output del task upstream (el build-fragment emite {@code fragmentSetId}), espejo de como el correctivo deriva
     * {@code correctivePayRunId} de {@code taskOutputs}.
     */
    private String normalPayFragmentSetId(TaskContext context, Map<String, Object> configuration) {
        var explicit = stringOrNull(configuration.get("fragmentSetId"));
        if (explicit != null) {
            return explicit;
        }
        var derived = upstreamOutputValue(context, configuration, "fragmentSetId");
        if (derived == null) {
            throw new IllegalArgumentException("MT101_STATUS resolveNormalPay requires configuration.fragmentSetId "
                    + "or an upstream output (input.sourceTaskRef) exposing fragmentSetId");
        }
        return derived;
    }

    /** Lee un valor escalar del output del task upstream referenciado por {@code input.sourceTaskRef}. */
    @SuppressWarnings("unchecked")
    private String upstreamOutputValue(TaskContext context, Map<String, Object> configuration, String key) {
        var rawTaskOutputs = context.attributes().get("taskOutputs");
        if (!(rawTaskOutputs instanceof Map<?, ?> taskOutputs) || taskOutputs.isEmpty()
                || !(configuration.get("input") instanceof Map<?, ?> rawInput)) {
            return null;
        }
        var sourceTaskRef = stringValue(((Map<String, Object>) rawInput).get("sourceTaskRef"), "");
        if (sourceTaskRef.isBlank()) {
            return null;
        }
        return stringOrNull(taskOutputs.get(sourceTaskRef + "." + key));
    }

    private TaskResult executeCorrectiveQuery(TaskContext context,
                                              Map<String, Object> configuration,
                                              Map<String, Object> corrective) {
        var runId = stringRequired(corrective.get("correctivePayRunId"), "input.correctivePayRunId");
        var connectionRef = stringOrNull(corrective.get("connectionRef"));
        var effectiveConfiguration = new LinkedHashMap<String, Object>(configuration);
        if (!effectiveConfiguration.containsKey("connectionRef") && connectionRef != null) {
            effectiveConfiguration.put("connectionRef", connectionRef);
        }
        var queryCfg = mapValue(configuration.get("query"));
        // STATUS por ruta (P2 v22): si se declara routeQuery (override por ruta REST/SFTP/...),
        // cada fragmento se consulta contra el endpoint de SU ruta. Sin routeQuery, todas las
        // rutas comparten query.url (caso aceptado por el v22). Sin fallback: en modo route-aware,
        // una ruta sin entrada en routeQuery es error ruidoso (no se consulta contra otro endpoint).
        var routeQuery = mapValue(configuration.get("routeQuery"));
        var routeAware = !routeQuery.isEmpty();
        var urlTemplate = routeAware
                ? stringOrNull(queryCfg.get("url"))
                : stringRequired(queryCfg.get("url"), "query.url");
        var httpMethod = stringValue(queryCfg.get("method"), "GET").toUpperCase(Locale.ROOT);
        var timeoutSeconds = intValue(queryCfg.get("timeoutSeconds"), DEFAULT_TIMEOUT_SECONDS);
        var expected = mapValue(configuration.get("expectedGatewayResponse"));
        var statusPath = stringValue(expected.get("statusField"), DEFAULT_STATUS_PATH);
        var referencePath = stringValue(expected.get("referenceField"), DEFAULT_REFERENCE_PATH);
        var pageSize = intValue(configuration.get("pageSize"), 500);
        var maxRecordsInOutput = intValue(configuration.get("maxRecordsInOutput"), DEFAULT_MAX_RECORDS_IN_OUTPUT);
        var payStatuses = correctivePayStatuses(configuration.get("correctivePayStatuses"));
        var resolveCorrectivePay = boolValue(configuration.get("resolveCorrectivePay"), false);
        // v56-fix: plan de consulta (route-aware/REST/SFTP) resuelto por el ejecutor compartido.
        var planConfig = new Mt101StatusQueryExecutor.QueryPlanConfig(routeAware, routeQuery, urlTemplate,
                httpMethod, timeoutSeconds, statusPath, referencePath);

        var confirmations = new ArrayList<Map<String, Object>>();
        var errors = new ArrayList<Map<String, Object>>();
        var byStatus = new TreeMap<String, Integer>();
        var pendingRows = new ArrayList<ConfirmationRow>(PERSIST_BATCH_SIZE);
        var pendingAuditEntries = new ArrayList<Map<String, Object>>(PERSIST_BATCH_SIZE);
        var pendingPayResults = new ArrayList<Mt101RebuildRepository.PayFragmentResult>(PERSIST_BATCH_SIZE);
        // v35: archiveId por sendersReference del lote, para excluir del sync de archive los refs que el
        // ledger marque en conflicto (no volcar el archive a un terminal contradictorio con el ledger).
        var archiveIdByRef = new LinkedHashMap<String, Long>();
        var dataSource = resolveDataSource(connectionRef);
        var afterId = 0L;
        int queriedCount = 0;
        int confirmedCount = 0;
        int errorCount = 0;
        int resolvedPayCount = 0;
        try {
            while (true) {
                var page = rebuildRepository.correctivePayStatusRecords(dataSource, runId, payStatuses, afterId, pageSize);
                if (page.isEmpty()) {
                    break;
                }
                for (var record : page) {
                    queriedCount++;
                    // v56-fix: la resolucion de plan + ejecucion REST/SFTP (route-aware) vive en el ejecutor
                    // compartido. El provider conserva la persistencia/conteo. Un error de ruta/consulta -> error
                    // ruidoso; SFTP sin ACK aun -> pendiente (se mantiene el estado, se reintenta).
                    var result = statusQueryExecutor.query(record, planConfig);
                    if (result.error() != null) {
                        errorCount++;
                        byStatus.merge("ERROR", 1, Integer::sum);
                        if (errors.size() < maxRecordsInOutput) {
                            var entry = new LinkedHashMap<String, Object>();
                            entry.put("sendersReference", record.get("sendersReference"));
                            entry.put("gatewayReference", record.get("gatewayReference"));
                            entry.put("route", record.get("route"));
                            entry.put("status", "ERROR");
                            entry.put("error", result.error());
                            errors.add(entry);
                        }
                        continue;
                    }
                    if (result.pending()) {
                        // SFTP: el banco aun no dejo el ACK/NACK -> pendiente, se mantiene el estado actual.
                        continue;
                    }
                    var rawBody = result.rawBody();
                    var confirmedStatus = result.confirmedStatus();
                    var gatewayReference = result.gatewayReference();
                    pendingRows.add(new ConfirmationRow(readArchiveId(record), "STATUS_API",
                            gatewayReference, confirmedStatus, rawBody));
                    var auditEntry = new LinkedHashMap<String, Object>();
                    auditEntry.put("sendersReference", record.get("sendersReference"));
                    auditEntry.put("gatewayReference", gatewayReference);
                    auditEntry.put("status", confirmedStatus);
                    auditEntry.put("archiveId", record.get("archiveId"));
                    pendingAuditEntries.add(auditEntry);
                    if (resolveCorrectivePay) {
                        var resolvedPayStatus = correctivePayResolution(confirmedStatus, configuration);
                        if (resolvedPayStatus != null) {
                            var payRef = String.valueOf(record.get("sendersReference"));
                            pendingPayResults.add(new Mt101RebuildRepository.PayFragmentResult(
                                    payRef,
                                    resolvedPayStatus,
                                    gatewayReference,
                                    0,
                                    "REJECTED".equals(resolvedPayStatus) ? "confirmed by MT101_STATUS as " + confirmedStatus : null));
                            archiveIdByRef.put(payRef, readArchiveId(record));
                        }
                    }
                    if (pendingRows.size() >= PERSIST_BATCH_SIZE) {
                        // v35: resuelve el ledger PRIMERO para conocer los conflictos, y excluye sus archiveId
                        // del sync de archive (la confirmacion del banco se conserva como evidencia).
                        resolvedPayCount += flushPayResolutionAndConfirmations(context, effectiveConfiguration,
                                dataSource, runId, pendingRows, pendingAuditEntries, pendingPayResults, archiveIdByRef);
                        pendingRows.clear();
                        pendingAuditEntries.clear();
                        pendingPayResults.clear();
                        archiveIdByRef.clear();
                    }
                    confirmedCount++;
                    byStatus.merge(confirmedStatus == null ? "UNKNOWN" : confirmedStatus, 1, Integer::sum);
                    if (confirmations.size() < maxRecordsInOutput) {
                        var entry = new LinkedHashMap<String, Object>();
                        entry.put("sendersReference", record.get("sendersReference"));
                        entry.put("gatewayReference", gatewayReference);
                        entry.put("status", confirmedStatus);
                        confirmations.add(entry);
                    }
                }
                var last = page.get(page.size() - 1).get("ledgerId");
                afterId = last instanceof Number number ? number.longValue() : afterId + page.size();
                if (page.size() < pageSize) {
                    break;
                }
            }
            resolvedPayCount += flushPayResolutionAndConfirmations(context, effectiveConfiguration,
                    dataSource, runId, pendingRows, pendingAuditEntries, pendingPayResults, archiveIdByRef);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot read corrective PAY status records for run " + runId, error);
        }

        if (queriedCount == 0) {
            return TaskResult.success("MT101_STATUS skipped because there are no corrective PAY records to query");
        }
        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("queriedCount", queriedCount);
        outputs.put("confirmedCount", confirmedCount);
        outputs.put("errorCount", errorCount);
        outputs.put("countByStatus", byStatus);
        outputs.put("records", confirmations);
        outputs.put("errors", errors);
        outputs.put("recordsSampled", confirmedCount > confirmations.size() || errorCount > errors.size());
        outputs.put("correctivePayRunId", runId);
        outputs.put("resolvedPayCount", resolvedPayCount);

        var summary = "MT101_STATUS correctiveRun=" + runId
                + " queried=" + queriedCount
                + " confirmed=" + confirmedCount
                + " errors=" + errorCount;
        return errorCount == 0
                ? TaskResult.success(summary, outputs)
                : TaskResult.failure(summary, outputs);
    }

    // ------------------------------------------------------------------
    // Persistencia compartida
    // ------------------------------------------------------------------

    /** Fila a insertar en {@code mt101_confirmation}. */
    private record ConfirmationRow(Long archiveId,
                                   String confirmationType,
                                   String gatewayReference,
                                   String confirmedStatus,
                                   String rawPayload) {
    }

    /**
     * v35: resuelve el ledger PAY ANTES de tocar el archive para conocer los conflictos terminales y excluir
     * sus archiveId del sync de archive (no volcar el archive a un terminal contradictorio con el ledger; la
     * confirmacion del banco se conserva como evidencia en mt101_confirmation). Devuelve filas resueltas.
     */
    private int flushPayResolutionAndConfirmations(TaskContext context, Map<String, Object> configuration,
                                                   DataSource dataSource, String runId,
                                                   List<ConfirmationRow> rows, List<Map<String, Object>> auditEntries,
                                                   List<Mt101RebuildRepository.PayFragmentResult> payResults,
                                                   Map<String, Long> archiveIdByRef) throws SQLException {
        var conflictArchiveIds = new java.util.HashSet<Long>();
        var resolved = 0;
        if (payResults != null && !payResults.isEmpty()) {
            var result = rebuildRepository.resolvePayFragmentResults(dataSource, runId, payResults, "STATUS_API");
            resolved = result.updated();
            for (var reference : result.conflictReferences()) {
                var archiveId = archiveIdByRef.get(reference);
                if (archiveId != null) {
                    conflictArchiveIds.add(archiveId);
                }
            }
        }
        persistConfirmations(context, configuration, rows, auditEntries, conflictArchiveIds);
        return resolved;
    }

    private void persistConfirmations(TaskContext context,
                                      Map<String, Object> configuration,
                                      List<ConfirmationRow> rows,
                                      List<Map<String, Object>> auditEntries) {
        persistConfirmations(context, configuration, rows, auditEntries, java.util.Set.of());
    }

    private void persistConfirmations(TaskContext context,
                                      Map<String, Object> configuration,
                                      List<ConfirmationRow> rows,
                                      List<Map<String, Object>> auditEntries,
                                      java.util.Set<Long> conflictArchiveIds) {
        if (rows.isEmpty()) {
            return;
        }
        var connectionRef = stringOrNull(configuration.get("connectionRef"));
        var confirmationTable = sanitize(stringValue(configuration.get("confirmationTable"),
                DEFAULT_CONFIRMATION_TABLE));
        try (Connection connection = resolveDataSource(connectionRef).getConnection()) {
            var repositoryRows = new ArrayList<Mt101ConfirmationRepository.ConfirmationRow>(rows.size());
            for (var row : rows) {
                repositoryRows.add(new Mt101ConfirmationRepository.ConfirmationRow(
                        row.archiveId(),
                        row.confirmationType(),
                        row.gatewayReference(),
                        row.confirmedStatus(),
                        row.rawPayload()));
            }
            confirmationRepository.insertConfirmations(connection, confirmationTable, repositoryRows);
            // H5: avanza el estado durable en mt101_archive (CONFIRMED/REJECTED)
            // por archive_id. Mismo connection que la insercion de confirmacion.
            // v35: salvo los archiveId en conflicto terminal con el ledger (no se vuelca un estado
            // contradictorio; el conflicto queda en el ledger: pay_conflict + PAY_CONFLICT + run UNCERTAIN).
            syncArchiveStatus(connection, configuration, rows, conflictArchiveIds);
            emitRecordAudit(statusEnvelopes(context, rows, auditEntries,
                    acceptedStatuses(configuration.get("acceptedStatuses"))));
        } catch (SQLException error) {
            throw new IllegalStateException("MT101_STATUS DB error: " + error.getMessage(), error);
        }
    }

    private List<AuditEnvelope> statusEnvelopes(TaskContext context,
                                                List<ConfirmationRow> rows,
                                                List<Map<String, Object>> auditEntries,
                                                List<String> acceptedStatuses) {
        var result = new ArrayList<AuditEnvelope>(rows.size());
        for (int i = 0; i < rows.size(); i++) {
            var row = rows.get(i);
            var entry = auditEntries != null && i < auditEntries.size() ? auditEntries.get(i) : Map.<String, Object>of();
            var sendersReference = stringOrNull(entry.get("sendersReference"));
            var status = row.confirmedStatus() == null ? "UNKNOWN" : row.confirmedStatus();
            var accepted = acceptedStatuses.contains(status.toUpperCase(Locale.ROOT));
            result.add(new AuditEnvelope(
                    UUID.randomUUID().toString(),
                    context.processExecutionId() == null ? null : "exec-" + context.processExecutionId(),
                    sendersReference,
                    AuditLevel.RECORD,
                    "PAYMENT_STATUS_CONFIRMED",
                    accepted ? "CONFIRMED" : "REJECTED",
                    context.processExecutionId(),
                    context.taskDefinitionId(),
                    status,
                    null,
                    Map.of("confirmationType", row.confirmationType()),
                    "SWIFT",
                    "MT101",
                    null,
                    null,
                    null,
                    null,
                    null,
                    sendersReference,
                    null,
                    null,
                    row.archiveId(),
                    row.gatewayReference(),
                    Instant.now(),
                    AuditEnvelope.CURRENT_SCHEMA_VERSION));
        }
        return result;
    }

    private void emitRecordAudit(List<AuditEnvelope> envelopes) {
        if (recordAuditEmitter != null && envelopes != null && !envelopes.isEmpty()) {
            recordAuditEmitter.emitRecords(envelopes);
        }
    }

    private void syncArchiveStatus(Connection connection, Map<String, Object> configuration,
                                   List<ConfirmationRow> rows, java.util.Set<Long> conflictArchiveIds) {
        if (!boolValue(configuration.get("archiveStatusSync"), true)) {
            return;
        }
        var table = sanitize(stringValue(configuration.get("archiveStatusTable"), "mt101_archive"));
        var accepted = acceptedStatuses(configuration.get("acceptedStatuses"));
        var updates = new ArrayList<Mt101ArchiveStatusUpdater.ArchiveStatusUpdate>(rows.size());
        for (var row : rows) {
            if (row.archiveId() == null) {
                continue;
            }
            // v35: no se vuelca el archive a un terminal contradictorio con el ledger (conflicto detectado
            // al resolver el ledger). La confirmacion del banco ya quedo registrada como evidencia.
            if (conflictArchiveIds != null && conflictArchiveIds.contains(row.archiveId())) {
                continue;
            }
            var confirmed = row.confirmedStatus() != null
                    && accepted.contains(row.confirmedStatus().toUpperCase(Locale.ROOT));
            updates.add(new Mt101ArchiveStatusUpdater.ArchiveStatusUpdate(
                    row.archiveId(), confirmed ? "CONFIRMED" : "REJECTED"));
        }
        try {
            archiveStatusUpdater.updateArchiveStatus(connection, table, updates);
        } catch (SQLException error) {
            // 42P01 = tabla inexistente; 42703 = columna inexistente: flujo sin
            // archivo o tabla custom (no hay nada durable que sincronizar).
            if (!"42P01".equals(error.getSQLState()) && !"42703".equals(error.getSQLState())) {
                throw new IllegalStateException("MT101_STATUS archive sync error: " + error.getMessage(), error);
            }
        }
    }

    private List<String> acceptedStatuses(Object raw) {
        if (!(raw instanceof List<?> rawList) || rawList.isEmpty()) {
            return DEFAULT_ACCEPTED_STATUSES;
        }
        var result = new ArrayList<String>(rawList.size());
        for (var item : rawList) {
            result.add(String.valueOf(item).toUpperCase(Locale.ROOT));
        }
        return result;
    }

    private List<String> rejectedStatuses(Object raw) {
        if (!(raw instanceof List<?> rawList) || rawList.isEmpty()) {
            return DEFAULT_REJECTED_STATUSES;
        }
        var result = new ArrayList<String>(rawList.size());
        for (var item : rawList) {
            result.add(String.valueOf(item).toUpperCase(Locale.ROOT));
        }
        return result;
    }

    private List<String> correctivePayStatuses(Object raw) {
        if (!(raw instanceof List<?> rawList) || rawList.isEmpty()) {
            return List.of("SENT");
        }
        var result = new ArrayList<String>(rawList.size());
        for (var item : rawList) {
            if (item != null && !String.valueOf(item).isBlank()) {
                result.add(String.valueOf(item).trim().toUpperCase(Locale.ROOT));
            }
        }
        return result.isEmpty() ? List.of("SENT") : result;
    }

    private String correctivePayResolution(String confirmedStatus, Map<String, Object> configuration) {
        if (confirmedStatus == null || confirmedStatus.isBlank()) {
            return null;
        }
        var normalized = confirmedStatus.trim().toUpperCase(Locale.ROOT);
        if (acceptedStatuses(configuration.get("acceptedStatuses")).contains(normalized)) {
            return "SENT";
        }
        if (rejectedStatuses(configuration.get("rejectedStatuses")).contains(normalized)) {
            return "REJECTED";
        }
        return null;
    }

    private Map<String, Object> callbackConfig(Map<String, Object> configuration) {
        return mapValue(configuration.get("callback"));
    }

    // ------------------------------------------------------------------
    // Helpers de orquestacion (HTTP/JSON viven en Mt101StatusGateway)
    // ------------------------------------------------------------------

    private String resolveTemplate(String template, Map<String, Object> record) {
        var resolved = template;
        for (var entry : record.entrySet()) {
            var placeholder = "${" + entry.getKey() + "}";
            resolved = resolved.replace(placeholder,
                    entry.getValue() == null ? "" : String.valueOf(entry.getValue()));
        }
        return resolved;
    }

    private Long readArchiveId(Map<String, Object> record) {
        var raw = record.get("archiveId");
        if (raw == null) {
            return null;
        }
        if (raw instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(raw));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> readRecords(TaskContext context, Map<String, Object> configuration) {
        var corrective = correctivePaySource(context, configuration);
        if (!corrective.isEmpty()) {
            var dataSource = resolveDataSource(stringOrNull(corrective.get("connectionRef")));
            var runId = stringOrNull(corrective.get("correctivePayRunId"));
            var pageSize = intValue(configuration.get("pageSize"), 500);
            var payStatuses = correctivePayStatuses(configuration.get("correctivePayStatuses"));
            var afterId = 0L;
            var result = new ArrayList<Map<String, Object>>();
            try {
                while (true) {
                    var page = rebuildRepository.correctivePayStatusRecords(dataSource, runId, payStatuses, afterId, pageSize);
                    if (page.isEmpty()) {
                        return result;
                    }
                    result.addAll(page);
                    var last = page.get(page.size() - 1).get("ledgerId");
                    afterId = last instanceof Number number ? number.longValue() : afterId + page.size();
                    if (page.size() < pageSize) {
                        return result;
                    }
                }
            } catch (SQLException error) {
                throw new IllegalStateException("Cannot read corrective PAY status records for run " + runId, error);
            }
        }
        var rawTaskOutputs = context.attributes().get("taskOutputs");
        if (!(rawTaskOutputs instanceof Map<?, ?> taskOutputs) || taskOutputs.isEmpty()) {
            return List.of();
        }
        if (!(configuration.get("input") instanceof Map<?, ?> rawInput)) {
            throw new IllegalArgumentException("MT101_STATUS requires configuration.input");
        }
        var sourceTaskRef = stringValue(((Map<String, Object>) rawInput).get("sourceTaskRef"), "");
        if (sourceTaskRef.isBlank()) {
            throw new IllegalArgumentException("MT101_STATUS input.sourceTaskRef is required");
        }
        var sourceOutput = stringValue(((Map<String, Object>) rawInput).get("sourceOutput"), "records");
        var key = sourceTaskRef + "." + sourceOutput;
        var raw = taskOutputs.get(key);
        if (raw == null) {
            return List.of();
        }
        if (!(raw instanceof List<?> rawList)) {
            throw new IllegalArgumentException(
                    "Expected " + key + " to be List but got " + raw.getClass().getName());
        }
        var result = new ArrayList<Map<String, Object>>(rawList.size());
        for (var item : rawList) {
            if (item instanceof Map<?, ?> map) {
                var m = new LinkedHashMap<String, Object>();
                map.forEach((k, v) -> m.put(String.valueOf(k), v));
                result.add(m);
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> correctivePaySource(TaskContext context, Map<String, Object> configuration) {
        var rawTaskOutputs = context.attributes().get("taskOutputs");
        if (!(rawTaskOutputs instanceof Map<?, ?> taskOutputs) || taskOutputs.isEmpty()
                || !(configuration.get("input") instanceof Map<?, ?> rawInput)) {
            return Map.of();
        }
        var sourceTaskRef = stringValue(((Map<String, Object>) rawInput).get("sourceTaskRef"), "");
        if (sourceTaskRef.isBlank()) {
            return Map.of();
        }
        var sourceOutput = stringValue(((Map<String, Object>) rawInput).get("sourceOutput"), "records");
        var raw = taskOutputs.get(sourceTaskRef + "." + sourceOutput);
        if (!(raw instanceof Map<?, ?> rawMap) || !rawMap.containsKey("correctivePayRunId")) {
            return Map.of();
        }
        var source = new LinkedHashMap<String, Object>();
        rawMap.forEach((key, value) -> source.put(String.valueOf(key), value));
        return source;
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapValue(Object raw) {
        if (!(raw instanceof Map<?, ?> rawMap)) {
            return Map.of();
        }
        var result = new LinkedHashMap<String, Object>();
        rawMap.forEach((key, value) -> result.put(String.valueOf(key), value));
        return result;
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw);
        return value.isBlank() ? defaultValue : value;
    }

    private String stringOrNull(Object raw) {
        if (raw == null) {
            return null;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? null : value;
    }

    private String stringRequired(Object raw, String fieldName) {
        var value = stringOrNull(raw);
        if (value == null) {
            throw new IllegalArgumentException("MT101_STATUS requires configuration." + fieldName);
        }
        return value;
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(raw));
    }

    private boolean boolValue(Object raw, boolean defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(String.valueOf(raw));
    }

    private String sanitize(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Identifier cannot be blank");
        }
        if (!identifier.matches("[a-zA-Z_][a-zA-Z0-9_]*(\\.[a-zA-Z_][a-zA-Z0-9_]*)?")) {
            throw new IllegalArgumentException("Unsafe identifier: " + identifier);
        }
        return identifier;
    }
}
