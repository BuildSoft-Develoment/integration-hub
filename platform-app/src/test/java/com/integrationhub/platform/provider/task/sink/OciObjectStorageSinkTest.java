package com.integrationhub.platform.provider.task.sink;

import com.integrationhub.platform.provider.source.OciObjectStorageSourceProvider;
import com.integrationhub.platform.provider.source.S3SourceProvider;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * OCI expone una API S3-compatible, asi que este sink es una fachada: lo suyo es la TRADUCCION de la
 * config, y lo que hay que fijar es que no la reimplemente por su cuenta.
 */
class OciObjectStorageSinkTest {

    private static final byte[] CONTENIDO = "0228A01;fila\n".getBytes(StandardCharsets.UTF_8);

    private record Montaje(OciObjectStorageSink sink, S3Client client, S3SourceProvider s3Connections) {
    }

    private static Montaje montar() {
        var client = mock(S3Client.class);
        var s3Connections = mock(S3SourceProvider.class);
        when(s3Connections.clientFor(any())).thenReturn(client);
        // El provider de fuente NO se mockea: su traduccion es justo lo que se quiere ejercer.
        var connections = new OciObjectStorageSourceProvider(s3Connections);
        return new Montaje(new OciObjectStorageSink(connections, new S3Sink(s3Connections)), client, s3Connections);
    }

    private static Map<String, Object> conexion() {
        return Map.of(
                "namespace", "axaxnpcrorw5",
                "region", "us-ashburn-1",
                "bucket", "regulatorio",
                "prefix", "envios",
                "accessKeyId", "k",
                "secretAccessKey", "s");
    }

    @Test
    void tipoEsOciObjectStorage() {
        assertEquals("OCI_OBJECT_STORAGE", montar().sink().type());
    }

    @Test
    void entregaContraElEndpointCompatConPathStyleForzado() throws Exception {
        // Es lo unico propio de OCI: derivar el endpoint de namespace+region y forzar path-style, que la
        // API S3-compat exige. Se comprueba sobre la config que llega al cliente, no sobre la que se pasa.
        var montaje = montar();
        montaje.sink().deliver("/0228A01.228", () -> new ByteArrayInputStream(CONTENIDO), conexion());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> config = ArgumentCaptor.forClass(Map.class);
        verify(montaje.s3Connections()).clientFor(config.capture());
        assertEquals("https://axaxnpcrorw5.compat.objectstorage.us-ashburn-1.oraclecloud.com",
                config.getValue().get("endpoint"));
        assertEquals(true, config.getValue().get("pathStyleAccess"));
        assertEquals("access-key", config.getValue().get("authMode"));
    }

    @Test
    void heredaLaComposicionDeClaveYElLargoDeS3() throws Exception {
        var montaje = montar();
        montaje.sink().deliver("/SUCAVE/0228A01.228", () -> new ByteArrayInputStream(CONTENIDO), conexion());

        var request = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(montaje.client()).putObject(request.capture(), any(RequestBody.class));
        assertEquals("regulatorio", request.getValue().bucket());
        assertEquals("envios/SUCAVE/0228A01.228", request.getValue().key());
        assertEquals((long) CONTENIDO.length, request.getValue().contentLength());
    }

    @Test
    void sinNamespaceFallaAntesDeTocarLaRed() {
        var montaje = montar();
        var error = assertThrows(IllegalArgumentException.class,
                () -> montaje.sink().deliver("/x.txt", () -> new ByteArrayInputStream(CONTENIDO),
                        Map.of("region", "us-ashburn-1", "bucket", "b")));

        assertTrue(error.getMessage().contains("namespace"), error.getMessage());
    }

    @Test
    void sinBucketElErrorNombraOciYNoS3() {
        // Delegando a secas, el mensaje diria "S3 sink requires 'bucket'": un tipo que quien configura
        // no eligio, y que manda a buscar el problema donde no esta.
        var montaje = montar();
        var error = assertThrows(IllegalArgumentException.class,
                () -> montaje.sink().deliver("/x.txt", () -> new ByteArrayInputStream(CONTENIDO),
                        Map.of("namespace", "n", "region", "r")));

        assertTrue(error.getMessage().contains("OCI Object Storage"), error.getMessage());
        assertTrue(error.getMessage().contains("bucket"), error.getMessage());
    }

    @Test
    void unEndpointExplicitoMandaParaPoderApuntarAUnEmulador() throws Exception {
        var montaje = montar();
        montaje.sink().deliver("/x.txt", () -> new ByteArrayInputStream(CONTENIDO),
                Map.of("endpoint", "http://localhost:9000", "bucket", "b"));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> config = ArgumentCaptor.forClass(Map.class);
        verify(montaje.s3Connections()).clientFor(config.capture());
        assertEquals("http://localhost:9000", config.getValue().get("endpoint"));
    }
}
