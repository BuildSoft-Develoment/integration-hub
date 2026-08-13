package com.integrationhub.platform.provider.task.sink;

// @trace ADR-016 RF-011 (sink de salida GCS: WriteChannel STREAMING, visible solo al cerrar)

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.StorageException;
import com.integrationhub.platform.provider.source.GcsSourceProvider;
import com.integrationhub.platform.spi.task.sink.OutputSink;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.nio.channels.Channels;
import java.util.Map;

/**
 * ADR-016 / RF-011: sink Google Cloud Storage, espejo de salida de {@code GcsSourceProvider}.
 *
 * <p>Sube por <b>streaming</b> con {@code storage.writer(...)}: un {@code WriteChannel} que va mandando
 * trozos segun se leen, sin materializar el objeto. A diferencia de S3, no hace falta saber el tamano de
 * antemano.</p>
 *
 * <p>Sin temporal ni rename, por la misma razon que en S3: el objeto solo se finaliza al cerrar el canal, asi
 * que hasta entonces no existe para nadie. Un consumidor no puede ver un objeto a medio subir, que es
 * justo lo que el temporal viene a evitar en un filesystem. Y GCS tampoco tiene rename —seria copy +
 * delete—.</p>
 *
 * <h2>Por que el cierre NO va en un try-with-resources</h2>
 * <p>Porque cerrar es exactamente lo que PUBLICA el objeto. Con {@code try (var out = ...)} un fallo a
 * mitad de transferencia —se cae la red, el artefacto se vuelve ilegible— cerraria el canal igual al
 * salir del bloque, y GCS finalizaria el objeto con lo poco que hubiera llegado: un archivo regulatorio
 * truncado, visible y con pinta de bueno. Justo la corrupcion silenciosa que este sink dice evitar.</p>
 *
 * <p>Dejandolo sin cerrar, la sesion de subida se abandona y el objeto <b>nunca llega a existir</b>. Eso
 * es abortar en GCS: no hay operacion de cancelar, y borrarlo despues de finalizar dejaria una ventana
 * en la que el archivo a medias si es visible.</p>
 */
@ApplicationScoped
public class GcsSink implements OutputSink {

    private static final String LABEL = "GCS";

    /**
     * El cliente sale del provider de fuente a proposito: entrada y salida comparten UNA definicion
     * {@code /sources}. Ver {@link GcsSourceProvider#storageFor(Map)}.
     */
    private final GcsSourceProvider connections;

    @Inject
    public GcsSink(GcsSourceProvider connections) {
        this.connections = connections;
    }

    @Override
    public String type() {
        return "GCS";
    }

    @Override
    public void deliver(String dropPath, StreamSource source, Map<String, Object> configuration) throws IOException {
        var bucket = SinkConfigurationSupport.requireString(configuration, "bucket", LABEL);
        var key = SinkConfigurationSupport.joinPrefix(
                SinkConfigurationSupport.optionalString(configuration, "prefix"), dropPath);
        var blob = BlobInfo.newBuilder(BlobId.of(bucket, key)).build();

        try (var in = source.open()) {
            var out = Channels.newOutputStream(connections.storageFor(configuration).writer(blob));
            in.transferTo(out);
            // Deliberadamente fuera del try-with-resources: cerrar es publicar. Si transferTo falla, el
            // canal se queda sin cerrar y el objeto no llega a existir. Ver el javadoc de la clase.
            out.close();
        } catch (StorageException error) {
            throw new IOException("GCS sink could not deliver to gs://" + bucket + "/" + key, error);
        }
    }
}
