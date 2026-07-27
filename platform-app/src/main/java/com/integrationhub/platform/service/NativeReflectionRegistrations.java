package com.integrationhub.platform.service;


import com.integrationhub.platform.api.response.branding.BrandingResponse;
import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.service.execution.async.AsyncPageWorkItem;
import com.integrationhub.platform.service.execution.async.AsyncSliceWorkItem;
import com.integrationhub.platform.service.execution.async.QueuedProcessExecutionPayload;
import com.integrationhub.platform.service.plugin.PluginMarketplaceCatalog;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReadSkip;
import com.integrationhub.platform.spi.reader.SourcePosition;
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
        // White-label: BrandingResource#get devuelve jakarta.ws.rs.core.Response (para setear
        // el header CORS), no el DTO tipado -> Quarkus NO auto-registra BrandingResponse y en
        // nativo falla con "No serializer found" (cazado en smoke de integracion 2026-07-13).
        // El /api/branding es publico y lo consume el login white-label: romperlo mata el branding.
        BrandingResponse.class,
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
        // ADR-021: los tipos del vertical SWIFT MT101 se registran en su propio paquete
        // (Mt101ReflectionRegistrations). El motor no los nombra: asi no depende del vertical.
        // Catalogo remoto de plugins (HttpPluginMarketplaceCatalogClient)
        PluginMarketplaceCatalog.class,
        PluginMarketplaceCatalog.PluginMarketplaceEntry.class,
        // Payload gRPC hacia plugins remotos: el motor mete readResult/sourcePayload en
        // TaskContext.attributes y Grpc/BrokerRemotePluginTransport lo serializa entero
        // (cazado en smoke nativo 2026-07-13: HashMap["readResult"] -> ReadResult).
        ReadResult.class,
        ReadRecord.class,
        ReadSkip.class,
        SourcePosition.class,
})
public final class NativeReflectionRegistrations {

    private NativeReflectionRegistrations() {
    }
}
