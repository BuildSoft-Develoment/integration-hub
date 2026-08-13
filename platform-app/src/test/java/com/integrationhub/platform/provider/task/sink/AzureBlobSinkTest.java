package com.integrationhub.platform.provider.task.sink;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.specialized.BlobOutputStream;
import com.azure.storage.blob.specialized.BlockBlobClient;
import com.integrationhub.platform.provider.source.AzureBlobSourceProvider;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AzureBlobSinkTest {

    private static final byte[] CONTENIDO = "anexo;fila\nanexo;otra fila\n".getBytes(StandardCharsets.UTF_8);

    private record Montaje(AzureBlobSink sink, BlobContainerClient container, BlobOutputStream salida,
                           ByteArrayOutputStream subido) {
    }

    private static Montaje montar() {
        var subido = new ByteArrayOutputStream();
        var salida = mock(BlobOutputStream.class);
        doAnswer(invocation -> {
            subido.write(invocation.getArgument(0), invocation.getArgument(1), invocation.getArgument(2));
            return null;
        }).when(salida).write(any(byte[].class), anyInt(), anyInt());

        var blockBlob = mock(BlockBlobClient.class);
        when(blockBlob.getBlobOutputStream(anyBoolean())).thenReturn(salida);
        var blob = mock(BlobClient.class);
        when(blob.getBlockBlobClient()).thenReturn(blockBlob);
        var container = mock(BlobContainerClient.class);
        when(container.getBlobClient(any())).thenReturn(blob);

        var connections = mock(AzureBlobSourceProvider.class);
        when(connections.containerClientFor(any())).thenReturn(container);
        return new Montaje(new AzureBlobSink(connections), container, salida, subido);
    }

    @Test
    void tipoEsAzureBlob() {
        assertEquals("AZURE_BLOB", montar().sink().type());
    }

    @Test
    void sinContenedorFallaAntesDeTocarLaRed() {
        // El contenedor lo exige la resolucion de la conexion, compartida con la fuente: un solo sitio
        // decide que hace falta para hablar con esta cuenta.
        var connections = mock(AzureBlobSourceProvider.class);
        when(connections.containerClientFor(any()))
                .thenThrow(new IllegalArgumentException("Missing required configuration key: container"));
        var sink = new AzureBlobSink(connections);

        assertThrows(IllegalArgumentException.class,
                () -> sink.deliver("/x.txt", () -> new ByteArrayInputStream(CONTENIDO), Map.of()));
    }

    @Test
    void componeLaClaveConElPrefijoDeLaConexion() throws Exception {
        var montaje = montar();
        montaje.sink().deliver("/SUCAVE/0228A01.228", () -> new ByteArrayInputStream(CONTENIDO),
                Map.of("container", "regulatorio", "prefix", "envios"));

        var key = ArgumentCaptor.forClass(String.class);
        verify(montaje.container()).getBlobClient(key.capture());
        assertEquals("envios/SUCAVE/0228A01.228", key.getValue());
    }

    @Test
    void subeElArtefactoEnteroYCierraParaCommitear() throws Exception {
        // El commit de la lista de bloques ocurre al cerrar: hasta entonces el blob no existe para un
        // lector, que es la razon de que aqui tampoco haga falta temporal + rename.
        var montaje = montar();
        montaje.sink().deliver("x.txt", () -> new ByteArrayInputStream(CONTENIDO), Map.of("container", "c"));

        assertEquals(new String(CONTENIDO, StandardCharsets.UTF_8), montaje.subido().toString(StandardCharsets.UTF_8));
        verify(montaje.salida()).close();
    }

    @Test
    void pisaElBlobAnteriorParaQueUnReintentoNoChoque() throws Exception {
        // Con overwrite=false una re-entrega del mismo archivo fallaria con 409 y pareceria un problema de
        // permisos.
        var montaje = montar();
        montaje.sink().deliver("x.txt", () -> new ByteArrayInputStream(CONTENIDO), Map.of("container", "c"));

        verify(montaje.container().getBlobClient("x.txt").getBlockBlobClient()).getBlobOutputStream(true);
    }

    @Test
    void siLaTransferenciaFallaNoSeCommiteaNada() throws Exception {
        // La prueba que justifica que el close esté FUERA del try-with-resources: cerrar es commitear la
        // lista de bloques. Con el close automático, un fallo a mitad publicaría el blob truncado.
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
                () -> montaje.sink().deliver("x.txt", () -> fuente, Map.of("container", "c")));

        verify(montaje.salida(), never()).close();
    }
}
