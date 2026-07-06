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
 * <p>v60-fix (#4 opción a): {@code READY} ya no es solo nivel-config. Además de los tres gates + broker registrado,
 * exige {@code consumerLive} = el canal consumer {@code tasks-in} está <b>listo/conectado EN VIVO</b> (readiness real
 * del conector, vía {@link ConsumerChannelHealth}). Así {@code READY} deja de mentir cuando el consumer está
 * habilitado por config pero no consumiendo. La liveness del lado <b>publisher/relay</b> (que usa el {@code publisher()}
 * del SPI, no un canal reactive-messaging) NO es observable por el HealthReporter y queda diferida a una extensión del
 * SPI ({@code MessageBrokerProvider.health()}). {@code brokersRegistered} sigue siendo nivel-config (registro de beans).</p>
 */
@ApplicationScoped
public class AsyncAvailabilityService {

    /** Canal consumer de reactive-messaging cuya readiness viva condiciona READY (ver application.properties). */
    static final String TASKS_IN_CHANNEL = "tasks-in";

    /** Estado compuesto de la disponibilidad async del entorno. La UI falla cerrada tratando != READY como no listo. */
    public enum State {
        /** Async off: las tareas corren síncronas (el significado del flag único previo). */
        DISABLED,
        /** Async on pero falta un gate (relay, consumer habilitado+vivo, o broker) → no se ejecutaría end-to-end. */
        DEGRADED,
        /** Los tres gates on + broker registrado + consumer conectado EN VIVO. */
        READY
    }

    public record AsyncAvailability(State state,
                                    boolean executionEnabled,
                                    boolean dispatchEnabled,
                                    boolean consumerEnabled,
                                    boolean consumerLive,
                                    boolean brokersRegistered) {
    }

    private final MessageBrokerRegistry brokers;
    private final ConsumerChannelHealth channelHealth;
    private final boolean executionEnabled;
    private final boolean dispatchEnabled;
    private final boolean consumerEnabled;

    @Inject
    public AsyncAvailabilityService(
            MessageBrokerRegistry brokers,
            ConsumerChannelHealth channelHealth,
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
        // consumerLive solo tiene sentido si el consumer está habilitado: si no lo está, no hay canal que sondear.
        var consumerLive = consumerEnabled && channelHealth != null && channelHealth.ready(TASKS_IN_CHANNEL);
        return new AsyncAvailability(
                derive(executionEnabled, dispatchEnabled, consumerEnabled, consumerLive, brokersRegistered),
                executionEnabled, dispatchEnabled, consumerEnabled, consumerLive, brokersRegistered);
    }

    /** Derivación PURA del estado (sin dependencias): fácil de testear y de extender con más gates. */
    static State derive(boolean execution, boolean dispatch, boolean consumer, boolean consumerLive,
                        boolean brokersRegistered) {
        if (!execution) {
            return State.DISABLED;
        }
        if (!dispatch || !consumer || !consumerLive || !brokersRegistered) {
            return State.DEGRADED;
        }
        return State.READY;
    }
}
