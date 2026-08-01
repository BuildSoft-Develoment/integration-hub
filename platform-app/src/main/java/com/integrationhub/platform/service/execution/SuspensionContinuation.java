package com.integrationhub.platform.service.execution;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Codec del envelope de continuacion M-2.1: el contexto del pipeline
 * ({@code taskOutputs}, variables y trigger) capturado al suspender una tarea,
 * para que el resume pueda continuar las tareas downstream sin re-drive manual.
 *
 * <p><b>Limitacion documentada</b>: la rehidratacion devuelve los valores como
 * Maps/Lists/primitivos JSON. Los flujos masivos (fragment sources, contadores,
 * referencias) sobreviven intactos; objetos tipados en memoria (e.g.
 * {@code List<Mt101Message>} del flujo no-masivo) degradan a Maps y un consumidor
 * downstream tipado fallaria — para suspension con downstream usar la ruta de
 * fragmentos persistidos. Si el envelope no se puede serializar, se persiste
 * {@code null} y el resume degrada a {@code COMPLETED_NEEDS_REDRIVE}.</p>
 *
 * @trace spec 003-diseno-y-ejecucion-procesos T-017 (M-2.1), ADR-009
 */
@ApplicationScoped
public class SuspensionContinuation {

    private static final Logger LOG = Logger.getLogger(SuspensionContinuation.class);
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };
    /** Claves volatiles internas que no deben persistirse (e.g. contadores en vivo). */
    private static final String VOLATILE_KEY_PREFIX = "_staging";

    private final ObjectMapper objectMapper;

    public SuspensionContinuation(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** Contexto rehidratado del pipeline suspendido. */
    public record Envelope(
            LinkedHashMap<String, Object> taskOutputs,
            Map<String, String> executionVariables,
            String triggerSource
    ) {
    }

    /** Devuelve {@code null} si el contexto no es serializable (degrade controlado). */
    public String marshal(Map<String, Object> taskOutputs,
                          Map<String, String> executionVariables,
                          String triggerSource) {
        var filtered = new LinkedHashMap<String, Object>();
        if (taskOutputs != null) {
            taskOutputs.forEach((key, value) -> {
                if (key != null && !key.startsWith(VOLATILE_KEY_PREFIX)) {
                    filtered.put(key, value);
                }
            });
        }
        var envelope = new LinkedHashMap<String, Object>();
        envelope.put("taskOutputs", filtered);
        envelope.put("executionVariables", executionVariables == null ? Map.of() : executionVariables);
        envelope.put("triggerSource", triggerSource == null ? "" : triggerSource);
        try {
            return objectMapper.writeValueAsString(envelope);
        } catch (JsonProcessingException error) {
            LOG.warnf("Suspension continuation not serializable (%s); resume will report "
                    + "COMPLETED_NEEDS_REDRIVE instead of auto-continuing", error.getMessage());
            return null;
        }
    }

    /** Devuelve {@code null} si no hay envelope persistido o esta corrupto. */
    @SuppressWarnings("unchecked")
    public Envelope unmarshal(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            var raw = objectMapper.readValue(json, MAP_TYPE);
            var taskOutputs = new LinkedHashMap<String, Object>();
            if (raw.get("taskOutputs") instanceof Map<?, ?> outputs) {
                outputs.forEach((key, value) -> taskOutputs.put(String.valueOf(key), value));
            }
            var executionVariables = new LinkedHashMap<String, String>();
            if (raw.get("executionVariables") instanceof Map<?, ?> variables) {
                variables.forEach((key, value) -> executionVariables.put(
                        String.valueOf(key), value == null ? null : String.valueOf(value)));
            }
            var triggerSource = raw.get("triggerSource") == null ? "" : String.valueOf(raw.get("triggerSource"));
            return new Envelope(taskOutputs, executionVariables, triggerSource);
        } catch (JsonProcessingException error) {
            LOG.warnf("Suspension continuation corrupted (%s); resume will report "
                    + "COMPLETED_NEEDS_REDRIVE", error.getMessage());
            return null;
        }
    }
}
