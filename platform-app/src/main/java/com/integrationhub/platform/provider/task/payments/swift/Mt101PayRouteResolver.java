package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.spi.task.payments.Mt101Message;

import java.util.LinkedHashMap;
import java.util.Map;

public final class Mt101PayRouteResolver {

    public static final String DEFAULT_TRANSPORT = "REST";
    private static final String ROUTE_TRANSPORTS = "routeTransports";

    private Mt101PayRouteResolver() {
    }

    public static boolean hasRouteTransports(Map<String, Object> configuration) {
        return !routeTransports(configuration).isEmpty();
    }

    public static PayPlan resolve(Map<String, Object> configuration,
                                  String routedAs,
                                  String routeError,
                                  Mt101Message message) {
        var routeMap = routeTransports(configuration);
        if (routeMap.isEmpty()) {
            var transport = stringValue(configuration == null ? null : configuration.get("transport"), DEFAULT_TRANSPORT);
            var effective = configuration == null ? new LinkedHashMap<String, Object>() : new LinkedHashMap<>(configuration);
            return withCorrelation(transport, effective, message);
        }
        if (routeError != null && !routeError.isBlank()) {
            throw new IllegalStateException("MT101_PAY cannot dispatch fragment with route_error: " + routeError);
        }
        var route = stringValue(routedAs, null);
        if (route == null || "UNROUTED".equalsIgnoreCase(route)) {
            throw new IllegalStateException("MT101_PAY routeTransports requires routed_as persisted by MT101_ROUTE");
        }
        var routeConfig = routeMap.get(route);
        if (routeConfig == null) {
            throw new IllegalStateException("MT101_PAY routeTransports has no configuration for routed_as " + route);
        }
        var transport = stringValue(routeConfig.get("transport"), null);
        if (transport == null) {
            throw new IllegalStateException("MT101_PAY routeTransports." + route + ".transport is required");
        }
        var effective = configuration == null ? new LinkedHashMap<String, Object>() : new LinkedHashMap<>(configuration);
        effective.putAll(routeConfig);
        effective.remove(ROUTE_TRANSPORTS);
        return withCorrelation(transport, effective, message);
    }

    private static PayPlan withCorrelation(String transport,
                                           Map<String, Object> configuration,
                                           Mt101Message message) {
        var normalizedTransport = transport.toUpperCase(java.util.Locale.ROOT);
        var key = Mt101PaymentCorrelation.correlationKey(normalizedTransport, configuration, message);
        var dispatchConfiguration = Mt101PaymentCorrelation.withResolvedCorrelation(
                normalizedTransport, configuration, message);
        return new PayPlan(normalizedTransport, dispatchConfiguration, key);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Map<String, Object>> routeTransports(Map<String, Object> configuration) {
        if (configuration == null || !(configuration.get(ROUTE_TRANSPORTS) instanceof Map<?, ?> rawRoutes)) {
            return Map.of();
        }
        var result = new LinkedHashMap<String, Map<String, Object>>();
        for (var entry : rawRoutes.entrySet()) {
            if (entry.getKey() == null || !(entry.getValue() instanceof Map<?, ?> rawConfig)) {
                continue;
            }
            var config = new LinkedHashMap<String, Object>();
            rawConfig.forEach((key, value) -> config.put(String.valueOf(key), value));
            result.put(String.valueOf(entry.getKey()).trim(), config);
        }
        return result;
    }

    private static String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    public record PayPlan(String transport, Map<String, Object> configuration, String endpointRef) {
    }

    /**
     * v25/v26: destino REAL resuelto del despacho (REST: URL resuelta; SFTP: {@code sftp://host/dropPath}),
     * redactado de credenciales. Compartido por el servicio (al preparar el plan) y el provider (al
     * validar en el dispatch) para que computen idéntico.
     */
    @SuppressWarnings("unchecked")
    public static String dispatchDestination(PayPlan plan, Mt101Message message) {
        var config = plan.configuration();
        if ("SFTP".equalsIgnoreCase(plan.transport())) {
            var sftp = config.get("sftp") instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.<String, Object>of();
            var host = stringValue(sftp.get("host"), null);
            return "sftp://" + (host == null ? "?" : host) + (plan.endpointRef() == null ? "" : plan.endpointRef());
        }
        var rest = config.get("rest") instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.<String, Object>of();
        var url = stringValue(rest.get("url"), null);
        if (url == null) {
            return "rest://?";
        }
        return redactUrlCredentials(Mt101PaymentCorrelation.resolveTemplate(url, message));
    }

    private static String redactUrlCredentials(String url) {
        return url == null ? null : url.replaceAll("://[^/@\\s]+@", "://***@");
    }

    /**
     * v25/v26: hash sha256 del plan canónico por fragmento ({@code transport|ruta|destino|correlación|
     * payloadHash}). El provider lo recomputa al despachar y lo valida contra el persistido en el ledger:
     * así se DEMUESTRA "plan aprobado = plan usado", no solo se infiere.
     */
    public static String dispatchPlanHash(PayPlan plan, String payloadHash, String routedAs, Mt101Message message) {
        var destination = dispatchDestination(plan, message);
        var canonical = String.join("|",
                plan.transport() == null ? "" : plan.transport(),
                routedAs == null ? "" : routedAs,
                destination == null ? "" : destination,
                plan.endpointRef() == null ? "" : plan.endpointRef(),
                payloadHash == null ? "" : payloadHash);
        try {
            var digest = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(canonical.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 not available", error);
        }
    }
}
