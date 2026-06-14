package com.integrationhub.auditconsumer.coldstore;

import com.integrationhub.platform.audit.AuditEnvelope;

/**
 * Puerto del store frio de auditoria a nivel de registro. El consumidor depende de
 * esta abstraccion; el backend concreto (Postgres / ClickHouse / ...) se elige por
 * {@code audit.cold-store.type} sin tocar al consumidor (DIP/OCP).
 */
public interface ColdStore {

    void write(AuditEnvelope envelope);
}
