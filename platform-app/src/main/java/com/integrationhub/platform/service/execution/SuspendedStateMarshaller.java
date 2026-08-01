package com.integrationhub.platform.service.execution;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Codifica/decodifica el {@code suspendedState} de una tarea suspendida a JSON
 * para persistirlo en {@code process_task_execution.suspended_state}.
 *
 * <p>Politica: el state DEBE ser JSON-serializable (Maps, Lists, Strings,
 * Numbers, Booleans, null). Objetos custom como {@code Mt101Message} NO van
 * aqui — eso pertenece a {@code taskOutputs} que tiene otra ruta de
 * persistencia. El state es para datos de control del provider (tokens
 * externos, attempts, next-poll timestamps, etc.).</p>
 *
 * @trace spec 003-diseno-y-ejecucion-procesos T-017 (M-2 suspension engine), ADR-009
 */
@ApplicationScoped
public class SuspendedStateMarshaller {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public SuspendedStateMarshaller(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String marshal(Map<String, Object> state) {
        var source = state == null ? Map.<String, Object>of() : state;
        try {
            return objectMapper.writeValueAsString(source);
        } catch (JsonProcessingException error) {
            throw new IllegalStateException(
                    "Cannot serialize suspendedState; ensure values are JSON-friendly (Maps, Lists, primitives). "
                            + "Offending keys: " + source.keySet(),
                    error);
        }
    }

    public Map<String, Object> unmarshal(String json) {
        if (json == null || json.isBlank()) {
            return new LinkedHashMap<>();
        }
        try {
            var result = objectMapper.readValue(json, MAP_TYPE);
            return result == null ? new LinkedHashMap<>() : new LinkedHashMap<>(result);
        } catch (JsonProcessingException error) {
            throw new IllegalStateException(
                    "Cannot deserialize suspendedState JSON; suspension data may be corrupted: " + json,
                    error);
        }
    }
}
