package com.integrationhub.platform.provider.task.sink;

// @trace ADR-016 RF-011 (sink de salida S3: PutObject STREAMING, atomico por contrato del propio PUT)

import com.integrationhub.platform.provider.source.S3SourceProvider;
import com.integrationhub.platform.spi.task.sink.OutputSink;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.Map;

/**
 * ADR-016 / RF-011: sink AWS S3 (o compatible via {@code endpoint}, p. ej. MinIO), espejo de salida de
 * {@code S3SourceProvider}.
 *
 * <h2>Por que aqui NO hay temporal + rename</h2>
 * <p>Los otros sinks suben a {@code fichero.part} y renombran, porque en un filesystem o en un (S)FTP el
 * archivo es visible mientras se escribe y un consumidor puede llevarselo a medias. En S3 no: un
 * {@code PutObject} es atomico por contrato —el objeto aparece completo o no aparece—, asi que un temporal
 * no anadiria ninguna garantia y quitaria varias. S3 no tiene <i>rename</i>: habria que hacer COPY + DELETE,
 * que son dos operaciones no atomicas, cuestan transferencia, y dejan el temporal huerfano si la segunda
 * falla. El temporal seria un rito, no una proteccion.</p>
 *
 * <h2>Por que se mide el artefacto antes de subirlo</h2>
 * <p>El {@code PutObject} sincrono exige {@code Content-Length}: S3 no acepta {@code Transfer-Encoding:
 * chunked}. Y el SPI prohibe cargar el archivo en memoria. Asi que se cuenta en una primera pasada y se sube
 * en una segunda, apoyandose en la garantia explicita del SPI de que el {@code StreamSource} se puede
 * re-abrir. Es seguro porque el artefacto es inmutable entre las dos aperturas: {@code FILE_WRITE} termino
 * antes de que {@code FILE_DELIVER} empezara, y nada del pipeline lo reescribe.</p>
 *
 * <p>La subida usa {@code fromContentProvider}, que reabre el stream en cada reintento del SDK, en vez de
 * {@code fromInputStream}, que entrega un stream ya consumido y obligaria a desactivar los reintentos.</p>
 */
@ApplicationScoped
public class S3Sink implements OutputSink {

    private static final String LABEL = "S3";
    private static final int MEASURE_BUFFER = 64 * 1024;

    /**
     * El cliente sale del provider de fuente a proposito: entrada y salida comparten UNA definicion
     * {@code /sources}, asi que comparten la cadena de credenciales y el pool. Ver
     * {@link S3SourceProvider#clientFor(Map)}.
     */
    private final S3SourceProvider connections;

    @Inject
    public S3Sink(S3SourceProvider connections) {
        this.connections = connections;
    }

    @Override
    public String type() {
        return "S3";
    }

    @Override
    public void deliver(String dropPath, StreamSource source, Map<String, Object> configuration) throws IOException {
        var bucket = SinkConfigurationSupport.requireString(configuration, "bucket", LABEL);
        var key = SinkConfigurationSupport.joinPrefix(
                SinkConfigurationSupport.optionalString(configuration, "prefix"), dropPath);
        var length = measure(source);

        var request = PutObjectRequest.builder().bucket(bucket).key(key).contentLength(length).build();
        try {
            connections.clientFor(configuration).putObject(request,
                    RequestBody.fromContentProvider(() -> reopen(source), length, "application/octet-stream"));
        } catch (UncheckedIOException reopenFailed) {
            throw reopenFailed.getCause();
        } catch (SdkException error) {
            throw new IOException("S3 sink could not deliver to s3://" + bucket + "/" + key, error);
        }
    }

    /** Cuenta los bytes sin retenerlos: el SPI prohibe el archivo entero en memoria. */
    private static long measure(StreamSource source) throws IOException {
        var buffer = new byte[MEASURE_BUFFER];
        long total = 0;
        try (var in = source.open()) {
            int read;
            while ((read = in.read(buffer)) >= 0) {
                total += read;
            }
        }
        return total;
    }

    /** {@code ContentStreamProvider} no declara {@code IOException}; se envuelve y se desenvuelve arriba. */
    private static InputStream reopen(StreamSource source) {
        try {
            return source.open();
        } catch (IOException error) {
            throw new UncheckedIOException(error);
        }
    }
}
