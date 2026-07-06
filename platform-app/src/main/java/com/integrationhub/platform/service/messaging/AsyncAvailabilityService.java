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
 * {@code tasks.dispatch.enabled} (relay outbox→broker) y {@code mp.messaging.incoming.tasks-in.enabled} (consumer).</p>
 *
 * <p>v60-fix (#4): {@code READY} ya no es solo nivel-config. Además de los tres gates + broker registrado, exige la
 * readiness EN VIVO de dos canales (vía {@link ChannelHealth}):
 * <ul>
 *   <li>{@code consumerLive} (#4a) = el canal consumer {@code tasks-in} conectado (no solo habilitado);</li>
 *   <li>{@code dispatchLive} (#4b) = el canal producer {@code audit-out} —por el que el relay publica al broker Kafka—
 *       conectado. <b>Verificado</b> (E2E): con un broker inalcanzable, {@code audit-out} reporta readiness=false.</li>
 * </ul>
 * Así {@code READY} deja de mentir cuando el consumer no consume o el producer no está conectado. La liveness de los
 * brokers <b>de cliente crudo</b> (JMS/RabbitMQ/Redis, que no son canales reactive-messaging) queda diferida a una
 * extensión del SPI ({@code MessageBrokerProvider.health()}); solo aplica si se configura un broker no-Kafka.
 * {@code brokersRegistered} sigue siendo nivel-config (registro de beans).</p>
 */
@ApplicationScoped
public class AsyncAvailabilityService {

    /** Canal consumer cuya readiness viva condiciona READY (#4a). */
    public static final String TASKS_IN_CHANNEL = "tasks-in";
    /** Canal producer por el que el relay publica al broker; su readiness viva condiciona READY (#4b). */
    public static final String DISPATCH_CHANNEL = "audit-out";

    /** Estado compuesto de la disponibilidad async del entorno. La UI falla cerrada tratando != READY como no listo. */
    public enum State {
        /** Async off: las tareas corren síncronas (el significado del flag único previo). */
        DISABLED,
        /** Async on pero falta un gate (relay, consumer/producer habilitado+vivo, o broker) → no correría end-to-end. */
        DEGRADED,
        /** Los tres gates on + broker registrado + consumer Y producer conectados EN VIVO. */
        READY
    }

    public record AsyncAvailability(State state,
                                    boolean executionEnabled,
                                    boolean dispatchEnabled,
                                    boolean consumerEnabled,
                                    boolean consumerLive,
                                    boolean dispatchLive,
                                    boolean brokersRegistered) {
    }

    private final MessageBrokerRegistry brokers;
    private final ChannelHealth channelHealth;
    private final boolean executionEnabled;
    private final boolean dispatchEnabled;
    private final boolean consumerEnabled;

    @Inject
    public AsyncAvailabilityService(
            MessageBrokerRegistry brokers,
            ChannelHealth channelHealth,
            @ConfigProperty(name = "tasks.async.execution.enabled", defaultValue = "false") boolean executionEnabled,
            @ConfigProperty(name = "tasks.dispatch.enabled", defaultValue = "false") boolean dispatchEnabled,
            @ConfigProperty(name = "mp.messaging.incoming.tasks-in.enabled", defaultValue = "false") boolean consumerEnabled) {
        this.brokers = brokers;
        this.channelHealth = channelHealth;
        this.executionEnabled = executionEnabled;
        this.dispatchEnabled = dispatchEnabled;
        this.consumerEnabled = consumerEnabled;
    }

    public AsyncAvailability availability() {
        var brokersRegistered = brokers != null && !brokers.availableTypes().isEmpty();
        // Cada liveness solo tiene sentido si su gate de config está on: si no, no hay canal activo que sondear.
        var consumerLive = consumerEnabled && channelHealth != null && channelHealth.ready(TASKS_IN_CHANNEL);
        var dispatchLive = dispatchEnabled && channelHealth != null && channelHealth.ready(DISPATCH_CHANNEL);
        return new AsyncAvailability(
                derive(executionEnabled, dispatchEnabled, consumerEnabled, consumerLive, dispatchLive, brokersRegistered),
                executionEnabled, dispatchEnabled, consumerEnabled, consumerLive, dispatchLive, brokersRegistered);
    }

    /** Derivación PURA del estado (sin dependencias): fácil de testear y de extender con más gates. */
    static State derive(boolean execution, boolean dispatch, boolean consumer, boolean consumerLive,
                        boolean dispatchLive, boolean brokersRegistered) {
        if (!execution) {
            return State.DISABLED;
        }
        if (!dispatch || !consumer || !consumerLive || !dispatchLive || !brokersRegistered) {
            return State.DEGRADED;
        }
        return State.READY;
    }
}
