package com.integrationhub.platform.provider.task.payments.spi;

import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;

/**
 * SPI para formatear un mensaje MT101 en cualquier representacion publicable
 * ({@code JSON}, {@code XML}, {@code FIN} crudo).
 *
 * <p>Implementaciones son beans CDI registrados via {@link jakarta.enterprise.context.ApplicationScoped}.
 * El provider de build resuelve la implementacion por {@link #format()} consultando el
 * registro inyectado.</p>
 *
 * <p>Cada formato es intercambiable; agregar uno nuevo (p.ej. ISO 20022 pain.001 XML)
 * solo implica registrar otro bean, sin tocar el provider de build ni el motor.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-001
 * @trace ADR-009
 */
public interface PaymentMessageFormatter {

    /** Identificador del formato. Comparacion case-insensitive con {@code configuration.format}. */
    String format();

    /**
     * Serializa el mensaje a la representacion textual del formato. El resultado se
     * usa como {@code rawPayload} en {@link Mt101Message#rawPayload()} y como cuerpo
     * para los transportes de pago.
     *
     * @param message mensaje ya construido (sin {@code rawPayload}).
     * @return cadena lista para persistir/enviar.
     */
    String format(Mt101Message message);
}
