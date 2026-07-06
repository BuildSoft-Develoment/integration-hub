package com.integrationhub.platform.service.messaging;

/**
 * v60-fix (#4 opción a) — abstracción de la readiness EN VIVO de un canal consumer de mensajería.
 *
 * <p>Existe para que {@link AsyncAvailabilityService} dependa de una interfaz (DIP), no del stack concreto de
 * reactive-messaging. Permite testear la derivación del estado async con readiness viva/no-viva sin levantar el
 * broker. La impl productiva ({@link SmallRyeConsumerChannelHealth}) lee el {@code HealthReporter} de SmallRye.</p>
 */
public interface ConsumerChannelHealth {

    /**
     * @return {@code true} solo si el canal consumer indicado está <b>listo/conectado en vivo</b> (readiness real del
     * conector), no solo habilitado por config. Falla CERRADA: si no se puede determinar, devuelve {@code false}.
     */
    boolean ready(String channel);
}
