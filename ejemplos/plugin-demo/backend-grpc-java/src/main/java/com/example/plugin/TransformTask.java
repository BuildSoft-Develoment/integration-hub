package com.example.plugin;

import java.util.Locale;
import java.util.Map;

/**
 * Logica de negocio PURA del task {@code DEMO_TRANSFORM_JAVA}: transforma un texto
 * segun una operacion. Sin gRPC ni I/O: recibe la configuracion ya deserializada y
 * devuelve los outputs como un mapa. Esto la hace trivialmente testeable (ver
 * {@code TransformTaskTest}) y es el unico punto que un implementador de plugin
 * tocaria para cambiar el comportamiento.
 *
 * <p>Config esperada (proviene de {@code configuration_json}):</p>
 * <pre>
 *   { "text": "hola mundo", "op": "upper" }   // op ∈ upper | lower | reverse | (default) identity
 * </pre>
 * <p>Outputs (se serializan a {@code outputs_json}):</p>
 * <pre>
 *   { "result": "HOLA MUNDO", "op": "upper", "engine": "java" }
 * </pre>
 */
public final class TransformTask {

    /** Resultado de la ejecucion: exito + detalle legible + outputs para el motor. */
    public record Outcome(boolean success, String details, Map<String, Object> outputs) {
    }

    public Outcome execute(Map<String, Object> configuration) {
        var text = stringValue(configuration.get("text"));
        if (text == null) {
            // Fail-loud: sin texto no hay nada que transformar; el motor marca la tarea como fallida.
            return new Outcome(false, "DEMO_TRANSFORM_JAVA requires a non-empty 'text' in configuration",
                    Map.of("engine", "java"));
        }
        var op = stringValue(configuration.get("op"));
        var normalizedOp = op == null ? "identity" : op.toLowerCase(Locale.ROOT);
        var result = switch (normalizedOp) {
            case "upper" -> text.toUpperCase(Locale.ROOT);
            case "lower" -> text.toLowerCase(Locale.ROOT);
            case "reverse" -> new StringBuilder(text).reverse().toString();
            case "identity" -> text;
            default -> null;
        };
        if (result == null) {
            return new Outcome(false, "Unknown op '" + op + "' (expected upper|lower|reverse|identity)",
                    Map.of("engine", "java"));
        }
        return new Outcome(true, "transformed '" + text + "' with op=" + normalizedOp,
                Map.of("result", result, "op", normalizedOp, "engine", "java"));
    }

    private static String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        var text = String.valueOf(value);
        return text.isBlank() ? null : text;
    }
}
