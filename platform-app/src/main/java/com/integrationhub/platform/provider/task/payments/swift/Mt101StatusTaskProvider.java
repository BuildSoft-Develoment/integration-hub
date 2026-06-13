package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.task.SuspendableTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Types;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

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
 *   "confirmationTable": "mt101_confirmation"
 * }
 * }</pre>
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

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;

    @Inject
    public Mt101StatusTaskProvider(ObjectMapper objectMapper,
                                   DataSource defaultDataSource,
                                   ConnectionPoolManager connectionPoolManager) {
        this(objectMapper, HttpClient.newBuilder().build(), defaultDataSource, connectionPoolManager);
    }

    /** Constructor de test: permite inyectar un HttpClient custom. */
    Mt101StatusTaskProvider(ObjectMapper objectMapper,
                            HttpClient httpClient,
                            DataSource defaultDataSource,
                            ConnectionPoolManager connectionPoolManager) {
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
    }

    @Override
    public String type() {
        return "MT101_STATUS";
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var mode = stringValue(configuration.get("mode"), "query").toLowerCase(Locale.ROOT);
        return switch (mode) {
            case "query" -> executeQuery(context, configuration);
            case "callback" -> suspendForCallback(context, configuration);
            case "poll" -> pollRound(configuration, readRecords(context, configuration), 0);
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
            case "callback" -> resumeCallback(configuration, suspendedState);
            case "poll" -> pollRound(configuration, pendingFromState(suspendedState),
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

    private TaskResult resumeCallback(Map<String, Object> configuration, Map<String, Object> suspendedState) {
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

        persistConfirmations(configuration, matched);

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

    private TaskResult pollRound(Map<String, Object> configuration,
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
            var queryResult = queryGateway(httpMethod, url, timeoutSeconds);
            if (queryResult.error() != null) {
                stillPending.add(record);
                var entry = new LinkedHashMap<String, Object>();
                entry.put("sendersReference", record.get("sendersReference"));
                entry.put("gatewayReference", record.get("gatewayReference"));
                entry.put("error", queryResult.error());
                errors.add(entry);
                continue;
            }
            var status = extractField(queryResult.body(), statusPath);
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

        persistConfirmations(configuration, confirmed);

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

        var confirmations = new ArrayList<Map<String, Object>>(records.size());
        var rows = new ArrayList<ConfirmationRow>(records.size());
        var byStatus = new TreeMap<String, Integer>();
        var errors = new ArrayList<Map<String, Object>>();
        int queriedCount = 0;

        for (var record : records) {
            queriedCount++;
            var url = resolveTemplate(urlTemplate, record);
            var queryResult = queryGateway(httpMethod, url, timeoutSeconds);
            if (queryResult.error() != null) {
                var entry = new LinkedHashMap<String, Object>();
                entry.put("sendersReference", record.get("sendersReference"));
                entry.put("gatewayReference", record.get("gatewayReference"));
                entry.put("status", "ERROR");
                entry.put("error", queryResult.error());
                errors.add(entry);
                byStatus.merge("ERROR", 1, Integer::sum);
                continue;
            }
            var rawBody = queryResult.body();
            var confirmedStatus = extractField(rawBody, statusPath);
            var gatewayReference = extractField(rawBody, referencePath);
            if (gatewayReference == null) {
                gatewayReference = String.valueOf(record.getOrDefault("gatewayReference", ""));
            }
            rows.add(new ConfirmationRow(readArchiveId(record), "STATUS_API",
                    gatewayReference, confirmedStatus, rawBody));

            var entry = new LinkedHashMap<String, Object>();
            entry.put("sendersReference", record.get("sendersReference"));
            entry.put("gatewayReference", gatewayReference);
            entry.put("status", confirmedStatus);
            confirmations.add(entry);
            byStatus.merge(confirmedStatus == null ? "UNKNOWN" : confirmedStatus, 1, Integer::sum);
        }

        persistConfirmations(configuration, rows);

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("queriedCount", queriedCount);
        outputs.put("confirmedCount", confirmations.size());
        outputs.put("errorCount", errors.size());
        outputs.put("countByStatus", byStatus);
        outputs.put("records", confirmations);
        outputs.put("errors", errors);

        var summary = "MT101_STATUS queried=" + queriedCount
                + " confirmed=" + confirmations.size()
                + " errors=" + errors.size();
        return errors.isEmpty()
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

    private void persistConfirmations(Map<String, Object> configuration, List<ConfirmationRow> rows) {
        if (rows.isEmpty()) {
            return;
        }
        var connectionRef = stringOrNull(configuration.get("connectionRef"));
        var confirmationTable = sanitize(stringValue(configuration.get("confirmationTable"),
                DEFAULT_CONFIRMATION_TABLE));
        var sql = "insert into " + confirmationTable
                + " (archive_id, confirmation_type, gateway_reference, confirmed_status, raw_payload)"
                + " values (?, ?, ?, ?, ?)";
        try (Connection connection = resolveDataSource(connectionRef).getConnection();
             PreparedStatement insert = connection.prepareStatement(sql)) {
            for (var row : rows) {
                if (row.archiveId() == null) {
                    insert.setNull(1, Types.BIGINT);
                } else {
                    insert.setLong(1, row.archiveId());
                }
                insert.setString(2, row.confirmationType());
                insert.setString(3, row.gatewayReference());
                insert.setString(4, row.confirmedStatus());
                insert.setString(5, row.rawPayload());
                insert.addBatch();
            }
            insert.executeBatch();
            // H5: avanza el estado durable en mt101_archive (CONFIRMED/REJECTED)
            // por archive_id. Mismo connection que la insercion de confirmacion.
            syncArchiveStatus(connection, configuration, rows);
        } catch (SQLException error) {
            throw new IllegalStateException("MT101_STATUS DB error: " + error.getMessage(), error);
        }
    }

    private void syncArchiveStatus(Connection connection, Map<String, Object> configuration,
                                   List<ConfirmationRow> rows) {
        if (!boolValue(configuration.get("archiveStatusSync"), true)) {
            return;
        }
        var table = sanitize(stringValue(configuration.get("archiveStatusTable"), "mt101_archive"));
        var accepted = acceptedStatuses(configuration.get("acceptedStatuses"));
        var sql = "update " + table + " set status = ?, updated_at = current_timestamp where id = ?";
        try (PreparedStatement update = connection.prepareStatement(sql)) {
            var any = false;
            for (var row : rows) {
                if (row.archiveId() == null) {
                    continue;
                }
                var confirmed = row.confirmedStatus() != null
                        && accepted.contains(row.confirmedStatus().toUpperCase(Locale.ROOT));
                update.setString(1, confirmed ? "CONFIRMED" : "REJECTED");
                update.setLong(2, row.archiveId());
                update.addBatch();
                any = true;
            }
            if (any) {
                update.executeBatch();
            }
        } catch (SQLException error) {
            // 42P01 = tabla inexistente: flujo sin archivo (no hay nada que
            // sincronizar). Cualquier otro error de BD si se propaga.
            if (!"42P01".equals(error.getSQLState())) {
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

    private Map<String, Object> callbackConfig(Map<String, Object> configuration) {
        return mapValue(configuration.get("callback"));
    }

    // ------------------------------------------------------------------
    // HTTP + helpers (sin cambios respecto al modo query original)
    // ------------------------------------------------------------------

    private QueryResult queryGateway(String method, String url, int timeoutSeconds) {
        try {
            var request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .method(method, HttpRequest.BodyPublishers.noBody())
                    .build();
            var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            var status = response.statusCode();
            if (status >= 200 && status < 300) {
                return new QueryResult(response.body(), null);
            }
            return new QueryResult(response.body(),
                    "HTTP " + status + ": " + truncate(response.body(), 200));
        } catch (IOException error) {
            return new QueryResult(null, "IO error: " + error.getMessage());
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            return new QueryResult(null, "interrupted: " + error.getMessage());
        }
    }

    private String extractField(String body, String jsonPath) {
        if (body == null || body.isBlank() || jsonPath == null || !jsonPath.startsWith("$.")) {
            return null;
        }
        try {
            var node = objectMapper.readTree(body);
            return navigate(node, jsonPath.substring(2));
        } catch (IOException error) {
            return null;
        }
    }

    private String navigate(JsonNode node, String path) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        var dot = path.indexOf('.');
        var head = dot < 0 ? path : path.substring(0, dot);
        var tail = dot < 0 ? null : path.substring(dot + 1);
        var next = node.path(head);
        return tail == null ? (next.isValueNode() ? next.asText() : null) : navigate(next, tail);
    }

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

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    private String truncate(String value, int max) {
        if (value == null || value.length() <= max) return value;
        return value.substring(0, max) + "...";
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

    /** Resultado interno de la consulta HTTP al gateway. */
    private record QueryResult(String body, String error) {
    }
}
