package com.integrationhub.platform.provider.task.sink;

// @trace ADR-016 RF-011 (sink de salida Azure Blob: BlobOutputStream STREAMING, commit al cerrar)

import com.azure.storage.blob.models.BlobStorageException;
import com.integrationhub.platform.provider.source.AzureBlobSourceProvider;
import com.integrationhub.platform.spi.task.sink.OutputSink;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.util.Map;

/**
 * ADR-016 / RF-011: sink Azure Blob Storage, espejo de salida de {@code AzureBlobSourceProvider}.
 *
 * <p>Sube por <b>streaming</b> con {@code getBlobOutputStream(true)}: el cliente va subiendo bloques segun
 * se leen y hace el <i>commit</i> de la lista de bloques al cerrar. Sin temporal ni rename, por la misma
 * razon que en S3 y GCS: hasta ese commit el blob no existe para un lector, que es exactamente la garantia
 * que el temporal aporta en un filesystem.</p>
 *
 * <p>{@code overwrite = true}: una re-entrega del mismo archivo —un reintento tras un fallo de red, o el
 * reproceso de un envio— tiene que poder pisar el blob anterior. Con {@code false} el segundo intento
 * fallaria con un 409 y pareceria un problema de permisos.</p>
 *
 * <h2>Por que el cierre NO va en un try-with-resources</h2>
 * <p>Porque cerrar es lo que hace el commit de la lista de bloques, es decir, lo que PUBLICA el blob. Con
 * {@code try (var out = ...)} un fallo a mitad de transferencia cerraria el stream igual al salir del
 * bloque y Azure commitearia lo poco que hubiera subido: un archivo regulatorio truncado y visible.</p>
 *
 * <p>Sin ese commit, los bloques quedan <i>uncommitted</i>: no forman ningun blob, no los ve nadie, y
 * Azure los recoge solo. Eso es abortar aqui.</p>
 */
@ApplicationScoped
public class AzureBlobSink implements OutputSink {

    /**
     * El cliente sale del provider de fuente a proposito: entrada y salida comparten UNA definicion
     * {@code /sources}. Ver {@link AzureBlobSourceProvider#containerClientFor(Map)}.
     */
    private final AzureBlobSourceProvider connections;

    @Inject
    public AzureBlobSink(AzureBlobSourceProvider connections) {
        this.connections = connections;
    }

    @Override
    public String type() {
        return "AZURE_BLOB";
    }

    @Override
    public void deliver(String dropPath, StreamSource source, Map<String, Object> configuration) throws IOException {
        var key = SinkConfigurationSupport.joinPrefix(
                SinkConfigurationSupport.optionalString(configuration, "prefix"), dropPath);
        var container = connections.containerClientFor(configuration);

        try (var in = source.open()) {
            var out = container.getBlobClient(key).getBlockBlobClient().getBlobOutputStream(true);
            in.transferTo(out);
            // Deliberadamente fuera del try-with-resources: cerrar es commitear. Si transferTo falla, los
            // bloques se quedan sin commitear y no hay blob. Ver el javadoc de la clase.
            out.close();
        } catch (BlobStorageException error) {
            throw new IOException("Azure Blob sink could not deliver to container "
                    + container.getBlobContainerName() + " blob " + key, error);
        }
    }
}
