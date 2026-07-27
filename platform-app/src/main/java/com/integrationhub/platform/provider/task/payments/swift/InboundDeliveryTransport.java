package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.vertical.swift.mt101.spi.PaymentMessageTransport;

import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;

import java.util.Map;

/**
 * SPI de transporte de entrega del inbound de {@code MT101_INBOUND_DELIVER} (analogo a
 * {@code PaymentMessageTransport} de MT101_PAY). Cada implementacion declara su {@link #transport()} y el
 * provider selecciona la que matchea el {@code transport} de la config via {@code Instance<>}. Agregar un
 * transporte nuevo (p.ej. SFTP/Kafka inbound) = un bean nuevo, sin tocar el provider (open-closed).
 *
 * <p>Cada transporte pagina el store inbound y entrega la pagina a su destino, marcando el status y armando
 * su propio {@link TaskResult} (los outputs/summary difieren entre DB y REST).</p>
 */
public interface InboundDeliveryTransport {

    /** Identificador del transporte ({@code DB} / {@code REST}); se matchea case-insensitive con la config. */
    String transport();

    /**
     * Entrega los mensajes {@code ROUTED} del {@code inboundSource}, paginado, y devuelve el resultado.
     *
     * @param context       contexto de ejecucion (processExecutionId, etc.)
     * @param configuration config de la tarea (slice del transporte: url/method/... para REST)
     * @param inboundSource descriptor del set inbound a leer ({@code {inboundSetId, connectionRef, ...}})
     * @param pageSize      tamano de pagina al recorrer el store
     */
    TaskResult deliver(TaskContext context, Map<String, Object> configuration,
                       Map<String, Object> inboundSource, int pageSize);
}
