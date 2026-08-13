package com.integrationhub.platform.provider.task.sink;

import com.google.cloud.WriteChannel;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.integrationhub.platform.provider.source.GcsSourceProvider;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GcsSinkTest {

    private static final byte[] CONTENIDO = "anexo 01;fila\nanexo 01;otra fila\n".getBytes(StandardCharsets.UTF_8);

    private record Montaje(GcsSink sink, Storage storage, WriteChannel canal, ByteArrayOutputStream subido) {
    }

    private static Montaje montar() throws Exception {
        var subido = new ByteArrayOutputStream();
        var channel = mock(WriteChannel.class);
        when(channel.isOpen()).thenReturn(true);
        when(channel.write(any(ByteBuffer.class))).thenAnswer(invocation -> {
            ByteBuffer buffer = invocation.getArgument(0);
            var escritos = buffer.remaining();
            var bytes = new byte[escritos];
            buffer.get(bytes);
            subido.write(bytes);
            return escritos;
        });
        var storage = mock(Storage.class);
        when(storage.writer(any(BlobInfo.class))).thenReturn(channel);
        var connections = mock(GcsSourceProvider.class);
        when(connections.storageFor(any())).thenReturn(storage);
        return new Montaje(new GcsSink(connections), storage, channel, subido);
    }

    @Test
    void tipoEsGcs() throws Exception {
        assertEquals("GCS", montar().sink().type());
    }

    @Test
    void sinBucketFallaAntesDeTocarLaRed() throws Exception {
        var montaje = montar();
        assertThrows(IllegalArgumentException.class,
                () -> montaje.sink().deliver("/x.txt", () -> new ByteArrayInputStream(CONTENIDO), Map.of()));
    }

    @Test
    void componeLaClaveConElPrefijoDeLaConexion() throws Exception {
        var montaje = montar();
        montaje.sink().deliver("/SUCAVE/0228A01.228", () -> new ByteArrayInputStream(CONTENIDO),
                Map.of("bucket", "regulatorio", "prefix", "envios"));

        var blob = ArgumentCaptor.forClass(BlobInfo.class);
        verify(montaje.storage()).writer(blob.capture());
        assertEquals("regulatorio", blob.getValue().getBlobId().getBucket());
        assertEquals("envios/SUCAVE/0228A01.228", blob.getValue().getBlobId().getName());
    }

    @Test
    void subeElArtefactoEnteroPorElCanal() throws Exception {
        // El WriteChannel es lo que hace que aqui no haga falta medir el archivo como en S3: se manda por
        // trozos segun se lee, sin conocer el tamano y sin cargarlo en memoria.
        var montaje = montar();
        montaje.sink().deliver("x.txt", () -> new ByteArrayInputStream(CONTENIDO), Map.of("bucket", "b"));

        assertEquals(new String(CONTENIDO, StandardCharsets.UTF_8),
                montaje.subido().toString(StandardCharsets.UTF_8));
    }

    @Test
    void cerrarElCanalEsLoQueFinalizaElObjeto() throws Exception {
        // Sin el close no hay objeto: GCS lo publica al finalizar el canal. Esa es la razon de que aqui no
        // haga falta temporal + rename — un lector no puede ver nada a medio subir.
        var montaje = montar();
        montaje.sink().deliver("x.txt", () -> new ByteArrayInputStream(CONTENIDO), Map.of("bucket", "b"));

        verify(montaje.canal()).close();
        assertTrue(montaje.subido().size() > 0);
    }

    @Test
    void siLaTransferenciaFallaElObjetoNoSePublica() throws Exception {
        // La prueba que justifica que el close esté FUERA del try-with-resources. Con el close
        // automático, un fallo a mitad publicaría el objeto truncado: un archivo regulatorio incompleto,
        // visible, y con pinta de bueno.
        var montaje = montar();
        var fuente = new java.io.InputStream() {
            private int leidos;

            @Override
            public int read() throws java.io.IOException {
                if (leidos++ > 4) {
                    throw new java.io.IOException("se cayo la red a mitad");
                }
                return 'x';
            }
        };

        assertThrows(java.io.IOException.class,
                () -> montaje.sink().deliver("x.txt", () -> fuente, Map.of("bucket", "b")));

        verify(montaje.canal(), never()).close();
    }
}
