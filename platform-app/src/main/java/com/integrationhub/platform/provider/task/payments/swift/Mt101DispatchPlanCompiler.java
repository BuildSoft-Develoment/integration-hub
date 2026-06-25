package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.task.payments.Mt101Message;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.UnaryOperator;

/**
 * v37: convierte el ledger PAY en el CONTRATO EJECUTABLE. Compila (en la etapa de PREPARACION, sobre la config
 * PAY SIN resolver) una especificacion canonica de despacho por fragmento: transporte + configuracion con
 * referencias {@code ${secret:...}} intactas + correlacion. NUNCA persiste valores resueltos de secretos: un
 * secreto LITERAL en la config de PAY se rechaza. En el DISPATCH, {@link #materialize} re-resuelve solo las
 * referencias y reconstruye el {@link Mt101PayRouteResolver.PayPlan} SIN volver a decidir ruta/transporte.
 */
public final class Mt101DispatchPlanCompiler {

    public static final String SPEC_VERSION = "MT101_PAY_PLAN_V1";

    // v37 (P1): deteccion por SUBSTRING sobre el nombre normalizado (sin separadores), no por clave exacta.
    // Asi se detectan X-API-Key, X-Bank-Token, Authorization-Internal, client_secret, etc.
    private static final List<String> SECRET_NAME_TOKENS = List.of(
            "authorization", "password", "passphrase", "token", "secret", "privatekey",
            "apikey", "credential", "bearer", "knownhosts");
    // Credenciales embebidas en una URL (user:pass@host): nunca deben viajar literales en la spec.
    private static final java.util.regex.Pattern URL_CREDENTIALS =
            java.util.regex.Pattern.compile("://[^/@\\s]+:[^/@\\s]+@");

    private static boolean isSecretName(String name) {
        var normalized = name.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
        for (var token : SECRET_NAME_TOKENS) {
            if (normalized.contains(token)) {
                return true;
            }
        }
        return false;
    }

    private final ObjectMapper objectMapper;

    public Mt101DispatchPlanCompiler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** Especificacion canonica persistible + su hash. La config lleva refs de secretos, nunca resueltas. */
    public record CompiledDispatchSpec(String version, String specJson, String specHash) {
    }

    /**
     * Compila la spec desde la config PAY SIN resolver. Resuelve la ruta UNA sola vez (etapa de preparacion) y
     * fija transporte + config (con refs) + correlacion. Rechaza secretos literales (deben ser ${secret:...}).
     */
    public CompiledDispatchSpec compile(Map<String, Object> unresolvedPayConfig, String routedAs,
                                        String routeError, Mt101Message message) {
        var plan = Mt101PayRouteResolver.resolve(unresolvedPayConfig, routedAs, routeError, message);
        assertNoLiteralSecrets(plan.configuration(), "");
        var spec = new LinkedHashMap<String, Object>();
        spec.put("version", SPEC_VERSION);
        spec.put("transport", plan.transport());
        spec.put("endpointRef", plan.endpointRef());
        spec.put("configuration", canonicalize(plan.configuration()));
        try {
            var json = objectMapper.writeValueAsString(spec);
            return new CompiledDispatchSpec(SPEC_VERSION, json, sha256(json));
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("cannot serialize MT101_PAY dispatch spec", error);
        }
    }

    /**
     * Materializa el plan ejecutable desde la spec persistida: re-resuelve SOLO las referencias a secretos
     * (secretResolver) y reconstruye el PayPlan. NO consulta routeTransports ni la config vigente, NO recalcula
     * destino ni cambia transporte: solo traduce el contrato persistido.
     */
    @SuppressWarnings("unchecked")
    public Mt101PayRouteResolver.PayPlan materialize(String specJson, UnaryOperator<Map<String, Object>> secretResolver) {
        if (specJson == null || specJson.isBlank()) {
            throw new IllegalStateException("MT101_PAY corrective dispatch requires a persisted plan spec");
        }
        Map<String, Object> spec;
        try {
            spec = objectMapper.readValue(specJson, LinkedHashMap.class);
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("invalid persisted MT101_PAY dispatch spec", error);
        }
        var version = String.valueOf(spec.get("version"));
        if (!SPEC_VERSION.equals(version)) {
            throw new IllegalStateException("unsupported MT101_PAY dispatch spec version: " + version);
        }
        var transport = String.valueOf(spec.get("transport"));
        var endpointRef = spec.get("endpointRef") == null ? null : String.valueOf(spec.get("endpointRef"));
        var configuration = spec.get("configuration") instanceof Map<?, ?> map
                ? (Map<String, Object>) new LinkedHashMap<String, Object>((Map<String, Object>) map)
                : new LinkedHashMap<String, Object>();
        var resolved = secretResolver == null ? configuration : secretResolver.apply(configuration);
        return new Mt101PayRouteResolver.PayPlan(transport, resolved, endpointRef);
    }

    /** Hash estable de la spec persistida (para validar contrato persistido = contrato aprobado). */
    public String specHash(String specJson) {
        return sha256(specJson == null ? "" : specJson);
    }

    /** Ordena recursivamente las claves de los mapas para una serializacion canonica (hash estable). */
    @SuppressWarnings("unchecked")
    private Object canonicalize(Object value) {
        if (value instanceof Map<?, ?> map) {
            var ordered = new TreeMap<String, Object>();
            map.forEach((key, raw) -> ordered.put(String.valueOf(key), canonicalize(raw)));
            return ordered;
        }
        if (value instanceof List<?> list) {
            var result = new ArrayList<>(list.size());
            for (var item : list) {
                result.add(canonicalize(item));
            }
            return result;
        }
        return value;
    }

    /**
     * Un campo sensible de la spec debe ser una referencia {@code ${secret:...}}; un literal se rechaza (no se
     * persiste). v37 (P1): deteccion por substring del nombre normalizado (X-API-Key, X-Bank-Token,
     * client_secret, Authorization-Internal, ...) y rechazo de credenciales embebidas en URL (user:pass@host)
     * en CUALQUIER valor de cadena, no solo en claves "sensibles".
     */
    private void assertNoLiteralSecrets(Object value, String path) {
        if (value instanceof Map<?, ?> map) {
            map.forEach((key, raw) -> {
                var name = String.valueOf(key);
                var childPath = path.isEmpty() ? name : path + "." + name;
                if (isSecretName(name) && raw instanceof String text && !text.isBlank() && !text.contains("${")) {
                    throw new IllegalStateException("MT101_PAY dispatch spec secret '" + childPath
                            + "' must be a ${secret:...} reference, not a literal: the executable plan is"
                            + " persisted and must never contain resolved secrets");
                }
                assertNoLiteralSecrets(raw, childPath);
            });
        } else if (value instanceof List<?> list) {
            for (int i = 0; i < list.size(); i++) {
                assertNoLiteralSecrets(list.get(i), path + "[" + i + "]");
            }
        } else if (value instanceof String text && URL_CREDENTIALS.matcher(text).find()) {
            throw new IllegalStateException("MT101_PAY dispatch spec value at '" + path
                    + "' embeds URL credentials (user:pass@host); use a ${secret:...} reference instead");
        }
    }

    private static String sha256(String value) {
        try {
            var digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 not available", error);
        }
    }
}
