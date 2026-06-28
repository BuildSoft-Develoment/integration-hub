package com.integrationhub.platform.service.execution.async;

import jakarta.enterprise.context.ApplicationScoped;

import java.util.Map;

/**
 * Decide si una tarea corre sincrona (in-process) o asincrona (despachada por
 * broker) a partir de su configuracion. Ver ADR-015.
 *
 * <p>Contrato de configuracion de tarea:</p>
 * <ul>
 *   <li>{@code async: true} -> ASYNC; ausente o {@code false} -> SYNC (default).</li>
 *   <li>{@code transport: <broker>} -> override del broker; por defecto
 *       {@link #DEFAULT_TRANSPORT} (Kafka). La validez del broker la resuelve
 *       {@code MessageBrokerRegistry} en el despacho.</li>
 * </ul>
 *
 * <p>Logica pura (sin estado ni I/O) para que sea trivialmente testeable.</p>
 */
@ApplicationScoped
public class TaskDispatchPlanner {

    /** Broker por defecto cuando una tarea async no declara {@code transport}. */
    public static final String DEFAULT_TRANSPORT = "KAFKA";

    public TaskDispatch plan(Map<String, Object> configuration) {
        if (configuration == null || !asBoolean(configuration.get("async"))) {
            return TaskDispatch.sync();
        }

        var transport = asString(configuration.get("transport"));
        var resolved = (transport == null || transport.isBlank())
                ? DEFAULT_TRANSPORT
                : transport.trim().toUpperCase();
        return TaskDispatch.async(resolved);
    }

    private static boolean asBoolean(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        return value != null && "true".equalsIgnoreCase(String.valueOf(value).trim());
    }

    private static String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
