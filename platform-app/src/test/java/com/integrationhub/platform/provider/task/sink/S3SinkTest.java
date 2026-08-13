package com.integrationhub.platform.provider.task.sink;

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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Lo que puede salir mal aqui y no dar la cara: la clave destino (el archivo se sube igual, a otro sitio) y
 * el {@code Content-Length} (S3 manda exactamente esos bytes, asi que un largo de menos TRUNCA el objeto sin
 * que nadie falle).
 */
class S3SinkTest {

    private static final byte[] CONTENIDO = "0228A01;linea uno\n0228A01;linea dos\n".getBytes(StandardCharsets.UTF_8);

    private record Montaje(S3Sink sink, S3Client client) {
    }

    private static Montaje montar() {
        var client = mock(S3Client.class);
        var connections = mock(S3SourceProvider.class);
        when(connections.clientFor(any())).thenReturn(client);
        return new Montaje(new S3Sink(connections), client);
    }

    @Test
    void tipoEsS3() {
        assertEquals("S3", montar().sink().type());
    }

    @Test
    void sinBucketFallaAntesDeTocarLaRed() {
        var montaje = montar();
        assertThrows(IllegalArgumentException.class,
                () -> montaje.sink().deliver("/x.txt", () -> new ByteArrayInputStream(CONTENIDO), Map.of()));
    }

    @Test
    void componeLaClaveConElPrefijoDeLaConexion() throws Exception {
        var montaje = montar();
        montaje.sink().deliver("/SUCAVE/0228A01.228", () -> new ByteArrayInputStream(CONTENIDO),
                Map.of("bucket", "regulatorio", "prefix", "envios/"));

        var request = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(montaje.client()).putObject(request.capture(), any(RequestBody.class));
        assertEquals("regulatorio", request.getValue().bucket());
        assertEquals("envios/SUCAVE/0228A01.228", request.getValue().key());
    }

    @Test
    void declaraElLargoExactoDelArtefacto() throws Exception {
        // Se mide en una primera pasada porque el PutObject sincrono exige Content-Length y el SPI prohibe
        // cargar el archivo en memoria. Si el largo declarado fuera menor, S3 guardaria el objeto CORTADO.
        var montaje = montar();
        montaje.sink().deliver("x.txt", () -> new ByteArrayInputStream(CONTENIDO), Map.of("bucket", "b"));

        var request = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(montaje.client()).putObject(request.capture(), any(RequestBody.class));
        assertEquals((long) CONTENIDO.length, request.getValue().contentLength());
    }

    @Test
    void elCuerpoSeReabreEnCadaIntentoYLlevaElArtefactoEntero() throws Exception {
        // fromContentProvider, no fromInputStream: el SDK reabre el stream para reintentar. Se abre dos
        // veces seguidas y ambas deben dar el contenido completo — con un stream ya consumido, la segunda
        // subiria un objeto vacio.
        var montaje = montar();
        montaje.sink().deliver("x.txt", () -> new ByteArrayInputStream(CONTENIDO), Map.of("bucket", "b"));

        var body = ArgumentCaptor.forClass(RequestBody.class);
        verify(montaje.client()).putObject(any(PutObjectRequest.class), body.capture());
        var provider = body.getValue().contentStreamProvider();
        assertEquals(new String(CONTENIDO, StandardCharsets.UTF_8),
                new String(provider.newStream().readAllBytes(), StandardCharsets.UTF_8));
        assertEquals(new String(CONTENIDO, StandardCharsets.UTF_8),
                new String(provider.newStream().readAllBytes(), StandardCharsets.UTF_8));
    }
}
