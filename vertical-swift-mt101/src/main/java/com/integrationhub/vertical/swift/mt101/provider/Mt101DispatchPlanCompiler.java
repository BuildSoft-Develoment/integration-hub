package com.integrationhub.vertical.swift.mt101.provider;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;

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
    // v39: referencia DINAMICA a una fuente externa MUTABLE (secret/vault/env/config). Solo se permite en
    // campos de CREDENCIAL; en ruta/destino/endpoint/correlacion el valor debe ser estatico persistido, para
    // que "plan persistido = destino aprobado" sea estrictamente cierto (un secreto no puede mover el host).
    // No matchea plantillas de mensaje como ${sendersReference} (sin prefijo fuente:).
    private static final java.util.regex.Pattern DYNAMIC_REF =
            java.util.regex.Pattern.compile("\\$\\{(secret|vault|env|config):[^}]*\\}");
    // v40: un campo de credencial debe ser EXACTAMENTE una referencia ${fuente:nombre}, no una cadena que solo
    // contenga ${...} mezclado con literales.
    private static final java.util.regex.Pattern COMPLETE_REF =
            java.util.regex.Pattern.compile("\\$\\{(secret|vault|env|config):[^}]+\\}");

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
        assertSpecSafety(plan.configuration(), "", null);
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
     * Reglas de seguridad de la spec ejecutable persistida:
     * v37 (P1): un campo de CREDENCIAL (detectado por substring del nombre normalizado: X-API-Key, X-Bank-Token,
     *   client_secret, Authorization-Internal, ...) no puede ser un literal: debe ser una referencia.
     *   Ningun valor puede embeber credenciales en URL (user:pass@host).
     * v39: una referencia DINAMICA a fuente externa mutable ({@code ${secret|vault|env|config:...}}) solo se
     *   permite en campos de CREDENCIAL; en campos de ruta/destino/endpoint/correlacion el valor debe ser
     *   estatico persistido (un secreto no puede mover host/URL/puerto/path sin cambiar la spec). Las plantillas
     *   de mensaje ({@code ${sendersReference}}, {@code ${idempotencyKey}}) si se permiten (deterministas).
     */
    private void assertSpecSafety(Object value, String path, String fieldKey) {
        if (value instanceof Map<?, ?> map) {
            map.forEach((key, raw) -> {
                var name = String.valueOf(key);
                assertSpecSafety(raw, path.isEmpty() ? name : path + "." + name, name);
            });
        } else if (value instanceof List<?> list) {
            for (int i = 0; i < list.size(); i++) {
                assertSpecSafety(list.get(i), path + "[" + i + "]", fieldKey);
            }
        } else if (value instanceof String text && !text.isBlank()) {
            if (URL_CREDENTIALS.matcher(text).find()) {
                throw new IllegalStateException("MT101_PAY dispatch spec value at '" + path
                        + "' embeds URL credentials (user:pass@host); use a ${secret:...} reference instead");
            }
            var secretField = fieldKey != null && isSecretName(fieldKey);
            if (secretField) {
                // v40: un campo de credencial debe ser una referencia COMPLETA (${...}), no un literal ni una
                // cadena que solo "contenga ${" (p.ej. "Bearer token-real ${sendersReference}" o
                // "clave-real-${uetr}" mezclarian un secreto literal). Para esquemas tipo Bearer, usar una
                // estructura explicita {authScheme, token}.
                if (!COMPLETE_REF.matcher(text.trim()).matches()) {
                    throw new IllegalStateException("MT101_PAY dispatch spec secret '" + path
                            + "' must be a COMPLETE ${secret:...} reference (the whole value), not a literal nor a"
                            + " template mixing literals with ${...}: the persisted plan must never contain"
                            + " resolved secrets");
                }
            } else if (DYNAMIC_REF.matcher(text).find()) {
                throw new IllegalStateException("MT101_PAY dispatch spec field '" + path
                        + "' uses a dynamic reference (${secret|vault|env|config:...}) in a routing/destination"
                        + " field; only credential fields may reference secrets — host/URL/port/path/endpoint/"
                        + "correlation must be static persisted values so the persisted plan = approved destination");
            }
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
