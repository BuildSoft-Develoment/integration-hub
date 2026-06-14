package com.integrationhub.auditconsumer.coldstore;

import com.integrationhub.platform.audit.AuditEnvelope;

import java.util.Collection;

/**
 * Puerto del store frio de auditoria a nivel de registro. El consumidor depende de
 * esta abstraccion; el backend concreto (Postgres / ClickHouse / ...) se elige por
 * {@code audit.cold-store.type} sin tocar al consumidor (DIP/OCP).
 */
public interface ColdStore {

    void write(AuditEnvelope envelope);

    default void writeBatch(Collection<AuditEnvelope> envelopes) {
        if (envelopes == null || envelopes.isEmpty()) {
            return;
        }
        for (var envelope : envelopes) {
            write(envelope);
        }
    }
}
