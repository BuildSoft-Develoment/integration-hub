package com.integrationhub.auditconsumer;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.smallrye.reactive.messaging.annotations.Blocking;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.List;

/**
 * Consume las tramas de auditoria del MQ y las registra:
 * <ul>
 *   <li>{@code PROCESS} -> {@code audit_event} (read-model de la UI).</li>
 *   <li>{@code RECORD}  -> store frio para trazabilidad E2E.</li>
 * </ul>
 *
 * <p>Una trama ilegible (poison) se guarda en DLQ persistida y se confirma para
 * no bloquear el canal; un fallo de persistencia propaga -> nack -> reentrega
 * at-least-once.</p>
 */
@ApplicationScoped
public class AuditEventConsumer {

    private final AuditEventHandler handler;
    private final String topic;

    @Inject
    public AuditEventConsumer(AuditEventHandler handler,
                              @ConfigProperty(name = "audit.topic", defaultValue = "audit-events") String topic) {
        this.handler = handler;
        this.topic = topic;
    }

    AuditEventConsumer(AuditEventHandler handler) {
        this(handler, "audit-events");
    }

    // Consumo en LOTE (mp.messaging.incoming.audit-in.batch=true): SmallRye entrega
    // varios records por poll y el handler hace un solo writeBatch -> menos presion de
    // pool/round-trips a 1M+. El ack del lote es atomico; un poison se aisla a DLQ.
    @Incoming("audit-in")
    @Blocking("audit-worker-pool")
    public void consume(List<String> payloads) {
        handler.handleBatch(payloads, "KAFKA", topic);
    }
}
