package com.integrationhub.vertical.swift.mt101.provider.task;

import com.integrationhub.vertical.swift.mt101.provider.InboundDeliveryTransport;


import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.Map;

import static com.integrationhub.vertical.swift.mt101.provider.InboundDeliverySupport.intValue;
import static com.integrationhub.vertical.swift.mt101.provider.InboundDeliverySupport.stringValue;

/**
 * Task provider {@code MT101_INBOUND_DELIVER}: sink final del inbound (espejo de {@code MT101_PAY}). Lee del
 * store inbound los mensajes {@code ROUTED} por paginas y los entrega segun el {@code transport} configurado,
 * marcando el status por lote (memoria O(pageSize), escala a 1M).
 *
 * <p>El provider NO conoce los transportes concretos: resuelve el {@link InboundDeliveryTransport} que matchea
 * {@code transport} via {@code Instance<>} (igual que {@code MT101_PAY} con {@code PaymentMessageTransport}) y
 * delega. Agregar un transporte nuevo (SFTP/Kafka inbound) = un bean nuevo, sin tocar este provider
 * (open-closed). Transportes actuales: {@code DB} (default, tabla {@code inbound_routed_transaction}) y
 * {@code REST} (POST por mensaje).</p>
 *
 * @trace spec 008-mensajeria-pagos RF-007
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101InboundDeliverTaskProvider implements TaskProvider {

    private static final int DEFAULT_PAGE_SIZE = 500;
    private static final String DEFAULT_TRANSPORT = "DB";

    private final Instance<InboundDeliveryTransport> transports;

    @Inject
    public Mt101InboundDeliverTaskProvider(Instance<InboundDeliveryTransport> transports) {
        this.transports = transports;
    }

    @Override
    public String type() {
        return "MT101_INBOUND_DELIVER";
    }

    @Override
    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var inboundSource = Mt101MessageInputResolver.inboundSource(context, configuration, type());
        if (inboundSource.isEmpty()) {
            return TaskResult.success("MT101_INBOUND_DELIVER skipped because there is no inbound source");
        }
        var transportId = stringValue(configuration.get("transport"), DEFAULT_TRANSPORT).toUpperCase();
        var pageSize = intValue(configuration.get("pageSize"), DEFAULT_PAGE_SIZE);
        return resolveTransport(transportId).deliver(context, configuration, inboundSource, pageSize);
    }

    private InboundDeliveryTransport resolveTransport(String transportId) {
        for (var transport : transports) {
            if (transport.transport().equalsIgnoreCase(transportId)) {
                return transport;
            }
        }
        var available = new StringBuilder();
        transports.forEach(candidate -> {
            if (available.length() > 0) {
                available.append(", ");
            }
            available.append(candidate.transport());
        });
        throw new IllegalArgumentException("Unsupported MT101_INBOUND_DELIVER transport: " + transportId
                + ". Available: " + available);
    }
}
