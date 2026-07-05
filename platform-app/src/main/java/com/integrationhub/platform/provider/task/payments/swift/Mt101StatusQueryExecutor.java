package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.http.HttpClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * v55-fix (opción A) — ejecutor COMPARTIDO de la consulta de STATUS por transporte y ruta, extraído de
 * {@link Mt101StatusTaskProvider} para reusarlo en la resolución del UNCERTAIN normal
 * ({@link com.integrationhub.platform.service.payments.swift.Mt101PayUncertainResolutionService}) sin duplicar la
 * lógica. Dado un registro ({@code sendersReference}, {@code route}, …) y la config de consulta, resuelve el plan
 * (REST por HTTP o SFTP leyendo el ACK/NACK del banco, route-aware si hay {@code routeQuery}) y devuelve el
 * {@code confirmedStatus} crudo (o pendiente/error). NO clasifica a SENT/REJECTED ni persiste: eso lo hace cada
 * caller. Sin fallback: una ruta sin endpoint declarado es error ruidoso.
 */
public final class Mt101StatusQueryExecutor {

    private final Mt101StatusGateway gateway;
    private final Mt101StatusSftpGateway sftpGateway;

    public Mt101StatusQueryExecutor(Mt101StatusGateway gateway, Mt101StatusSftpGateway sftpGateway) {
        this.gateway = gateway;
        this.sftpGateway = sftpGateway;
    }

    public Mt101StatusQueryExecutor(ObjectMapper objectMapper) {
        this(new Mt101StatusGateway(HttpClient.newBuilder().build(), objectMapper), new Mt101StatusSftpGateway());
    }

    /** Config de la consulta compartida + route-aware (los defaults ya resueltos por el caller). */
    public record QueryPlanConfig(boolean routeAware, Map<String, Object> routeQuery, String sharedUrl,
                                  String sharedMethod, int sharedTimeout, String sharedStatusPath,
                                  String sharedReferencePath) {
    }

    /**
     * Resultado por registro: {@code confirmedStatus} crudo del gateway (o null); {@code pending} = el banco aún no
     * respondió (SFTP sin archivo) → mantener sin resolver; {@code error} = fallo de consulta (no concluyente).
     */
    public record StatusQueryResult(String confirmedStatus, String gatewayReference, String rawBody,
                                    boolean pending, String error) {
    }

    public StatusQueryResult query(Map<String, Object> record, QueryPlanConfig config) {
        var plan = resolveStatusQuery(record, config);
        if (plan.error() != null) {
            return new StatusQueryResult(null, null, null, false, plan.error());
        }
        if ("SFTP".equals(plan.transport())) {
            var responsePath = resolveTemplate(plan.responseFileTemplate(), record);
            var sftpResult = sftpGateway.fetchResponse(plan.sftp(), responsePath);
            if (sftpResult.error() != null) {
                return new StatusQueryResult(null, null, null, false, sftpResult.error());
            }
            if (!sftpResult.found()) {
                // El banco aún no dejó el ACK/NACK: pendiente (no error, no se resuelve).
                return new StatusQueryResult(null, null, null, true, null);
            }
            var rawBody = sftpResult.body();
            var confirmedStatus = plan.acceptedTokens().isEmpty()
                    ? gateway.extractField(rawBody, plan.statusPath())
                    : sftpGateway.classifyByTokens(rawBody, plan.acceptedTokens(), plan.rejectedTokens());
            var gatewayReference = String.valueOf(record.getOrDefault("gatewayReference", ""));
            return new StatusQueryResult(confirmedStatus, gatewayReference, rawBody, false, null);
        }
        var url = resolveTemplate(plan.url(), record);
        var queryResult = gateway.query(plan.method(), url, plan.timeoutSeconds());
        if (queryResult.error() != null) {
            return new StatusQueryResult(null, null, queryResult.body(), false, queryResult.error());
        }
        var rawBody = queryResult.body();
        var confirmedStatus = gateway.extractField(rawBody, plan.statusPath());
        var gatewayReference = gateway.extractField(rawBody, plan.referencePath());
        if (gatewayReference == null) {
            gatewayReference = String.valueOf(record.getOrDefault("gatewayReference", ""));
        }
        return new StatusQueryResult(confirmedStatus, gatewayReference, rawBody, false, null);
    }

    /**
     * Plan de consulta efectivo para un fragmento (resuelto por ruta), por transporte REST o SFTP, o {@code error}
     * si la ruta no tiene endpoint declarado.
     */
    record StatusQuery(String transport, String url, String method, int timeoutSeconds,
                       String statusPath, String referencePath,
                       Map<String, Object> sftp, String responseFileTemplate,
                       List<String> acceptedTokens, List<String> rejectedTokens, String error) {
        static StatusQuery rest(String url, String method, int timeout, String statusPath, String refPath) {
            return new StatusQuery("REST", url, method, timeout, statusPath, refPath,
                    null, null, List.of(), List.of(), null);
        }

        static StatusQuery sftp(Map<String, Object> sftp, String responseFileTemplate, String statusPath,
                                List<String> acceptedTokens, List<String> rejectedTokens) {
            return new StatusQuery("SFTP", null, null, 0, statusPath, null,
                    sftp, responseFileTemplate, acceptedTokens, rejectedTokens, null);
        }

        static StatusQuery error(String message) {
            return new StatusQuery(null, null, null, 0, null, null, null, null, List.of(), List.of(), message);
        }
    }

    StatusQuery resolveStatusQuery(Map<String, Object> record, QueryPlanConfig config) {
        if (!config.routeAware()) {
            return StatusQuery.rest(config.sharedUrl(), config.sharedMethod(), config.sharedTimeout(),
                    config.sharedStatusPath(), config.sharedReferencePath());
        }
        var route = stringOrNull(record.get("route"));
        if (route == null) {
            return StatusQuery.error("fragment has no route (routed_as) but routeQuery is configured; "
                    + "refusing to pick a STATUS endpoint by fallback");
        }
        var override = mapValue(config.routeQuery().get(route));
        var routeTransport = stringValue(override.get("transport"), "REST").toUpperCase(Locale.ROOT);
        if ("SFTP".equals(routeTransport)) {
            var sftp = mapValue(override.get("sftp"));
            var responseFileTemplate = stringOrNull(override.get("responseFileTemplate"));
            if (sftp.isEmpty() || responseFileTemplate == null) {
                return StatusQuery.error("SFTP STATUS route '" + route + "' requires routeQuery." + route
                        + ".sftp and .responseFileTemplate (the bank ACK/NACK file path)");
            }
            var accepted = stringList(override.get("acceptedTokens"));
            var rejected = stringList(override.get("rejectedTokens"));
            if (accepted.isEmpty() && stringOrNull(override.get("statusField")) == null) {
                return StatusQuery.error("SFTP STATUS route '" + route + "' requires acceptedTokens "
                        + "(and rejectedTokens) or a statusField to classify the response file");
            }
            return StatusQuery.sftp(sftp, responseFileTemplate,
                    stringValue(override.get("statusField"), config.sharedStatusPath()), accepted, rejected);
        }
        var routeUrl = stringOrNull(override.get("url"));
        if (routeUrl == null) {
            return StatusQuery.error("no routeQuery entry with url for route '" + route
                    + "'; refusing to query it against another route's STATUS endpoint");
        }
        return StatusQuery.rest(
                routeUrl,
                stringValue(override.get("method"), config.sharedMethod()).toUpperCase(Locale.ROOT),
                intValue(override.get("timeoutSeconds"), config.sharedTimeout()),
                stringValue(override.get("statusField"), config.sharedStatusPath()),
                stringValue(override.get("referenceField"), config.sharedReferencePath()));
    }

    private String resolveTemplate(String template, Map<String, Object> record) {
        var resolved = template;
        for (var entry : record.entrySet()) {
            resolved = resolved.replace("${" + entry.getKey() + "}",
                    entry.getValue() == null ? "" : String.valueOf(entry.getValue()));
        }
        return resolved;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapValue(Object raw) {
        return raw instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    private List<String> stringList(Object raw) {
        if (!(raw instanceof List<?> rawList)) {
            return List.of();
        }
        var result = new ArrayList<String>(rawList.size());
        for (var item : rawList) {
            if (item != null) {
                result.add(String.valueOf(item));
            }
        }
        return result;
    }

    private String stringOrNull(Object raw) {
        if (raw == null) {
            return null;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? null : value;
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw instanceof Number number) {
            return number.intValue();
        }
        if (raw == null) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(String.valueOf(raw).trim());
        } catch (NumberFormatException error) {
            return defaultValue;
        }
    }
}
