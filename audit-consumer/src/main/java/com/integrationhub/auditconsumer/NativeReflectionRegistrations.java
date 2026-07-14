package com.integrationhub.auditconsumer;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * Registro de reflexion para la imagen NATIVA del audit-consumer.
 *
 * <p>El consumer DESERIALIZA {@link AuditEnvelope} (JSON de Kafka) con Jackson. En nativo,
 * sin registrar el record, Jackson no encuentra el constructor y falla con
 * "Cannot construct instance ... this appears to be a native image" -> el evento se
 * dead-letterea y no se persiste. {@code AuditEnvelope}/{@code AuditLevel} viven en
 * platform-contract (sin dependencia de Quarkus), por eso se registran por {@code targets}.</p>
 */
@RegisterForReflection(targets = {
        AuditEnvelope.class,
        AuditLevel.class,
})
public final class NativeReflectionRegistrations {

    private NativeReflectionRegistrations() {
    }
}
