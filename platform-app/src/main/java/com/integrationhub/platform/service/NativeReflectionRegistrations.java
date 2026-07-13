package com.integrationhub.platform.service;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.service.execution.async.AsyncPageWorkItem;
import com.integrationhub.platform.service.execution.async.AsyncSliceWorkItem;
import com.integrationhub.platform.service.execution.async.QueuedProcessExecutionPayload;
import com.integrationhub.platform.service.plugin.PluginMarketplaceCatalog;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * Registro central de reflexion para la imagen NATIVA (GraalVM).
 *
 * <p>Los DTO/records que Jackson (de)serializa <b>fuera</b> de la capa REST no los registra
 * Quarkus automaticamente (solo los tipos referenciados por endpoints JAX-RS). En JVM funciona
 * igual, pero en nativo Jackson no encuentra propiedades y falla con
 * {@code InvalidDefinitionException: No serializer found ... this appears to be a native image}.
 * Descubierto en runtime nativo con {@link QueuedProcessExecutionPayload} al lanzar una
 * ejecucion async (E2E SFTP 2026-07-12); el resto son los demas tipos internos que pasan por
 * ObjectMapper manualmente (spool de auditoria, backbone async, routing MT101, marketplace).</p>
 *
 * <p>{@code AuditEnvelope}/{@code AsyncTaskEnvelope} viven en platform-contract, que no depende
 * de Quarkus: por eso se registran por {@code targets} desde aqui en vez de anotarlos alla.</p>
 */
@RegisterForReflection(targets = {
        // Lanzamiento async de ejecuciones (ProcessExecutionCommandService.startAsync)
        QueuedProcessExecutionPayload.class,
        // Trama de auditoria productor -> MQ -> consumidor (AuditSpoolWriter). Ojo:
        // audit.fail-business-on-error=false hace que esta rotura sea SILENCIOSA en nativo.
        AuditEnvelope.class,
        AuditLevel.class,
        // Backbone async (AsyncTaskMessageCodec / AsyncTaskConsumer)
        AsyncTaskEnvelope.class,
        AsyncSliceWorkItem.class,
        AsyncPageWorkItem.class,
        // Money-path MT101: Mt101RouteTaskProvider convierte el mensaje a Map via Jackson
        Mt101Message.class,
        Mt101Message.Envelope.class,
        Mt101Message.SequenceA.class,
        Mt101Message.Transaction.class,
        Mt101Message.Amount.class,
        Mt101Message.Party.class,
        Mt101Message.ControlTotals.class,
        // Catalogo remoto de plugins (HttpPluginMarketplaceCatalogClient)
        PluginMarketplaceCatalog.class,
        PluginMarketplaceCatalog.PluginMarketplaceEntry.class,
})
public final class NativeReflectionRegistrations {

    private NativeReflectionRegistrations() {
    }
}
