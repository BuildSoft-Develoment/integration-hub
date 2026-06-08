package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
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
import java.util.Map;
import java.util.TreeMap;

/**
 * Task provider {@code MT101_STATUS}: consulta el estado actual de mensajes
 * enviados al gateway y persiste la confirmacion a {@code mt101_confirmation}.
 *
 * <p><b>Modos soportados (slice 2.2)</b>:</p>
 * <ul>
 *   <li>{@code query}: GET HTTP por mensaje, single-shot. Tipicamente invocado
 *       por scheduler (spec 006) para correr periodicamente sin necesidad de
 *       tareas long-running.</li>
 *   <li>{@code poll}: requiere M-2 (tareas long-running con resumption) -
 *       deferido hasta que el motor lo soporte.</li>
 *   <li>{@code callback}: endpoint inbound recibe push del gateway - tambien
 *       deferido (forma parte de la integracion con scheduler/eventos).</li>
 * </ul>
 *
 * <p><b>Configuracion</b>:</p>
 * <pre>{@code
 * {
 *   "mode": "query",
 *   "executionMode": "per-record",
 *   "input": { "sourceTaskRef": "pay-mt101", "sourceOutput": "records" },
 *   "query": {
 *     "url": "https://gateway.banco/v1/swift/status/${gatewayReference}",
 *     "method": "GET",
 *     "timeoutSeconds": 30
 *   },
 *   "expectedGatewayResponse": {
 *     "statusField": "$.status",
 *     "referenceField": "$.gatewayReference",
 *     "errorMessageField": "$.error.message"
 *   },
 *   "connectionRef": "12",
 *   "confirmationTable": "mt101_confirmation"
 * }
 * }</pre>
 *
 * <p>Cada {@code record} de entrada debe traer {@code gatewayReference} y/o
 * {@code sendersReference}. La URL se templeta con ambas.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-005, T-013
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101StatusTaskProvider implements TaskProvider {

    private static final int DEFAULT_TIMEOUT_SECONDS = 30;
    private static final String DEFAULT_CONFIRMATION_TABLE = "mt101_confirmation";
    private static final String DEFAULT_STATUS_PATH = "$.status";
    private static final String DEFAULT_REFERENCE_PATH = "$.gatewayReference";

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
        var mode = stringValue(configuration.get("mode"), "query");
        if (!"query".equals(mode)) {
            throw new IllegalArgumentException(
                    "MT101_STATUS mode '" + mode + "' requires M-2 (long-running tasks); not yet supported");
        }

        var records = readRecords(context, configuration);
        if (records.isEmpty()) {
            return TaskResult.success("MT101_STATUS skipped because there are no messages to query");
        }

        var queryCfg = mapValue(configuration.get("query"));
        var urlTemplate = stringRequired(queryCfg.get("url"), "query.url");
        var httpMethod = stringValue(queryCfg.get("method"), "GET").toUpperCase();
        var timeoutSeconds = intValue(queryCfg.get("timeoutSeconds"), DEFAULT_TIMEOUT_SECONDS);
        var expected = mapValue(configuration.get("expectedGatewayResponse"));
        var statusPath = stringValue(expected.get("statusField"), DEFAULT_STATUS_PATH);
        var referencePath = stringValue(expected.get("referenceField"), DEFAULT_REFERENCE_PATH);
        var connectionRef = stringOrNull(configuration.get("connectionRef"));
        var dataSource = resolveDataSource(connectionRef);
        var confirmationTable = sanitize(stringValue(configuration.get("confirmationTable"),
                DEFAULT_CONFIRMATION_TABLE));

        var confirmations = new ArrayList<Map<String, Object>>(records.size());
        var byStatus = new TreeMap<String, Integer>();
        var errors = new ArrayList<Map<String, Object>>();
        int queriedCount = 0;

        try (Connection connection = dataSource.getConnection()) {
            var insertSql = "insert into " + confirmationTable
                    + " (archive_id, confirmation_type, gateway_reference, confirmed_status, raw_payload)"
                    + " values (?, ?, ?, ?, ?)";
            try (PreparedStatement insert = connection.prepareStatement(insertSql)) {
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
                    var archiveId = readArchiveId(record);

                    insert.clearParameters();
                    if (archiveId == null) {
                        insert.setNull(1, Types.BIGINT);
                    } else {
                        insert.setLong(1, archiveId);
                    }
                    insert.setString(2, "STATUS_API");
                    insert.setString(3, gatewayReference);
                    insert.setString(4, confirmedStatus);
                    insert.setString(5, rawBody);
                    insert.executeUpdate();

                    var entry = new LinkedHashMap<String, Object>();
                    entry.put("sendersReference", record.get("sendersReference"));
                    entry.put("gatewayReference", gatewayReference);
                    entry.put("status", confirmedStatus);
                    confirmations.add(entry);
                    byStatus.merge(confirmedStatus == null ? "UNKNOWN" : confirmedStatus, 1, Integer::sum);
                }
            }
        } catch (SQLException error) {
            throw new IllegalStateException("MT101_STATUS DB error: " + error.getMessage(), error);
        }

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
