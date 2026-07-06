package com.integrationhub.platform.service.messaging;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * v59-fix — deriva el estado de disponibilidad COMPUESTO del despacho async, a partir de los tres gates
 * independientes (validados en el análisis) + el registro de brokers. Separa la lógica de disponibilidad del borde
 * HTTP (SRP): {@code MessagingTransportsResource} solo delega. Testeable en aislamiento (los flags entran por el
 * constructor).
 *
 * <p><b>Gates</b> (todos default {@code false}): {@code tasks.async.execution.enabled} (offload al outbox),
 * {@code tasks.dispatch.enabled} (relay outbox→broker) y {@code mp.messaging.incoming.tasks-in.enabled} (consumer).
 * El estado es a NIVEL-CONFIG (no un health en vivo): {@code brokersRegistered} = hay algún broker registrado, no que
 * el tipo de una tarea concreta esté conectado. El health en vivo (broker/consumer) queda diferido.</p>
 */
@ApplicationScoped
public class AsyncAvailabilityService {

    /** Estado compuesto de la disponibilidad async del entorno. La UI falla cerrada tratando != READY como no listo. */
    public enum State {
        /** Async off: las tareas corren síncronas (el significado del flag único previo). */
        DISABLED,
        /** Async on pero falta un gate (relay, consumer o broker) → no se ejecutaría end-to-end. */
        DEGRADED,
        /** Los tres gates on + hay broker registrado (nivel-config, no probado en vivo). */
        READY
    }

    public record AsyncAvailability(State state,
                                    boolean executionEnabled,
                                    boolean dispatchEnabled,
                                    boolean consumerEnabled,
                                    boolean brokersRegistered) {
    }

    private final MessageBrokerRegistry brokers;
    private final boolean executionEnabled;
    private final boolean dispatchEnabled;
    private final boolean consumerEnabled;

    @Inject
    public AsyncAvailabilityService(
            MessageBrokerRegistry brokers,
            @ConfigProperty(name = "tasks.async.execution.enabled", defaultValue = "false") boolean executionEnabled,
            @ConfigProperty(name = "tasks.dispatch.enabled", defaultValue = "false") boolean dispatchEnabled,
            @ConfigProperty(name = "mp.messaging.incoming.tasks-in.enabled", defaultValue = "false") boolean consumerEnabled) {
        this.brokers = brokers;
        this.executionEnabled = executionEnabled;
        this.dispatchEnabled = dispatchEnabled;
        this.consumerEnabled = consumerEnabled;
    }

    public AsyncAvailability availability() {
        var brokersRegistered = brokers != null && !brokers.availableTypes().isEmpty();
        return new AsyncAvailability(
                derive(executionEnabled, dispatchEnabled, consumerEnabled, brokersRegistered),
                executionEnabled, dispatchEnabled, consumerEnabled, brokersRegistered);
    }

    /** Derivación PURA del estado (sin dependencias): fácil de testear y de extender con más gates. */
    static State derive(boolean execution, boolean dispatch, boolean consumer, boolean brokersRegistered) {
        if (!execution) {
            return State.DISABLED;
        }
        if (!dispatch || !consumer || !brokersRegistered) {
            return State.DEGRADED;
        }
        return State.READY;
    }
}
