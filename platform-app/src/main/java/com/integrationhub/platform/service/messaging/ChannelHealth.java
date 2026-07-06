package com.integrationhub.platform.service.messaging;

/**
 * v60-fix (#4) — abstracción de la readiness EN VIVO de un canal de reactive-messaging (por nombre), de entrada o
 * salida.
 *
 * <p>Existe para que {@link AsyncAvailabilityService} dependa de una interfaz (DIP), no del stack concreto de
 * reactive-messaging. Permite testear la derivación del estado async con readiness viva/no-viva sin levantar el
 * broker. La impl productiva ({@link SmallRyeChannelHealth}) lee el {@code HealthCenter} de SmallRye. Se usa para el
 * canal consumer {@code tasks-in} (#4a) y para el canal producer {@code audit-out} del relay (#4b) — de ahí el nombre
 * genérico (no consumer-específico).</p>
 */
public interface ChannelHealth {

    /**
     * @return {@code true} solo si el canal indicado está <b>listo/conectado en vivo</b> (readiness real del conector),
     * no solo habilitado por config. Falla CERRADA: si no se puede determinar, devuelve {@code false}.
     */
    boolean ready(String channel);
}
