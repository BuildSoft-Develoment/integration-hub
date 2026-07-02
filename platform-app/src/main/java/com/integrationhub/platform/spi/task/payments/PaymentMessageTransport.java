package com.integrationhub.platform.spi.task.payments;


import java.util.Map;

/**
 * SPI para enviar un mensaje de pago al banco/gateway.
 *
 * <p>Implementaciones (CDI {@link jakarta.enterprise.context.ApplicationScoped}):</p>
 * <ul>
 *   <li>{@code RestPaymentTransport}: HTTP/HTTPS al gateway REST del banco.</li>
 *   <li>{@code SftpPaymentTransport}: upload SFTP (slice 4+).</li>
 *   <li>{@code MqPaymentTransport}: cola MQ (slice 4+).</li>
 * </ul>
 *
 * <p>Cada transporte declara su {@link #transport()} y lo selecciona
 * {@code Mt101PayTaskProvider} por la config {@code configuration.transport}.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-004, RF-016, RF-017, RF-018, T-009
 * @trace ADR-009
 */
public interface PaymentMessageTransport {

    /** Identificador: {@code REST}, {@code SFTP}, {@code MQ}. Case-insensitive. */
    String transport();

    /**
     * Envia un mensaje al gateway/destino.
     *
     * @param message mensaje compuesto con {@code rawPayload} ya formateado.
     * @param configuration sub-config del transporte (de {@code configuration.rest},
     *                      {@code .sftp}, {@code .mq}) + claves transversales como
     *                      {@code idempotencyKeyTemplate}, {@code retryPolicy},
     *                      {@code expectedGatewayResponse}.
     * @return resultado del despacho con detalles de intentos.
     */
    TransportResult send(Mt101Message message, Map<String, Object> configuration);
}
