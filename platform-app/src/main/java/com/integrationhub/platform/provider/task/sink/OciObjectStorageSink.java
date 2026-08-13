package com.integrationhub.platform.provider.task.sink;

// @trace ADR-016 RF-011 (sink de salida OCI Object Storage: fachada sobre S3Sink, espejo de la fuente)

import com.integrationhub.platform.provider.source.OciObjectStorageSourceProvider;
import com.integrationhub.platform.spi.task.sink.OutputSink;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.util.Map;

/**
 * ADR-016 / RF-011: sink OCI Object Storage (Oracle Cloud), <b>fachada delgada</b> sobre {@link S3Sink}.
 *
 * <p>Es el espejo exacto de {@code OciObjectStorageSourceProvider}, que ya es una fachada sobre el
 * provider S3: OCI expone una API S3-compatible, asi que aqui no hay nada de Oracle. Se traduce la
 * configuracion amigable (namespace/region/bucket) al shape S3 —endpoint compat derivado, path-style
 * forzado, {@code access-key} por defecto— y se entrega con el mismo camino ya homologado en nativo.</p>
 *
 * <p><b>La traduccion no se reimplementa aqui</b>, se pide al provider de fuente. Una definicion
 * {@code /sources} de OCI describe una conexion, no un sentido: si el endpoint compat o el path-style
 * se derivaran en dos sitios, se corregirian en uno solo el dia que Oracle cambie el formato.</p>
 *
 * <p>Todo lo que hace S3 lo hereda tal cual: el {@code PutObject} atomico —sin temporal ni rename—, la
 * medida del artefacto para el {@code Content-Length}, la reapertura del cuerpo en los reintentos y el
 * rechazo de un {@code prefix} con plantilla.</p>
 */
@ApplicationScoped
public class OciObjectStorageSink implements OutputSink {

    private final OciObjectStorageSourceProvider connections;
    private final S3Sink s3;

    @Inject
    public OciObjectStorageSink(OciObjectStorageSourceProvider connections, S3Sink s3) {
        this.connections = connections;
        this.s3 = s3;
    }

    @Override
    public String type() {
        return "OCI_OBJECT_STORAGE";
    }

    @Override
    public void deliver(String dropPath, StreamSource source, Map<String, Object> configuration) throws IOException {
        // El bucket se comprueba AQUI aunque S3Sink lo vuelva a comprobar: delegando a secas, a quien
        // configura un destino OCI le responderia "S3 sink requires 'bucket'". Un mensaje que nombra un
        // tipo que el operador no eligio manda a buscar el problema donde no esta.
        SinkConfigurationSupport.requireString(configuration, "bucket", "OCI Object Storage");
        s3.deliver(dropPath, source, connections.toS3Configuration(configuration));
    }
}
