package com.integrationhub.platform.spi.engine;

import com.integrationhub.platform.audit.AuditEnvelope;

import java.util.Collection;

/**
 * Puerto para emitir auditoria a nivel de registro en lote, desde el hot-path de
 * los providers (flujo masivo / SWIFT). Los providers dependen de esta abstraccion,
 * no del {@code AuditService} concreto (ISP/DIP), y los tests la falsean trivial.
 *
 * <p>La emision es batcheada para no degradar el throughput a 1M+ registros, y
 * fuera de la TX de negocio (el spool usa su propia mini-TX).</p>
 */
public interface RecordAuditEmitter {

    void emitRecords(Collection<AuditEnvelope> envelopes);
}
