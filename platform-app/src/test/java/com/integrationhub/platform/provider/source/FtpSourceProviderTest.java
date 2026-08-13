package com.integrationhub.platform.provider.source;

import org.apache.commons.net.ftp.FTPClient;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// @covers spec 001-catalogo-fuentes RF-005: seleccion de archivo unico FTP (sin fileNameTemplate)
class FtpSourceProviderTest {

    // --- guard de directorio: remotePath="/" emitia un SelectedSourceFile con nombre vacio ---

    @Test
    void conRemotePathRaizSinTemplateFallaSinTocarElServidor() throws Exception {
        var ftpClient = mock(FTPClient.class);

        var error = assertThrows(IllegalStateException.class,
                () -> FtpSourceProvider.selectSingleRemoteFile(ftpClient, "/", null));

        assertTrue(error.getMessage().contains("requires 'fileNameTemplate'"),
                "el mensaje debe decir que un directorio exige fileNameTemplate: " + error.getMessage());
        // El nombre vacio se detecta sin roundtrip extra al servidor.
        verify(ftpClient, never()).changeWorkingDirectory("/");
    }

    @Test
    void conRemotePathDirectorioSinTemplateFallaConMensajeAccionable() throws Exception {
        var ftpClient = mock(FTPClient.class);
        when(ftpClient.changeWorkingDirectory("/upload")).thenReturn(true);

        var error = assertThrows(IllegalStateException.class,
                () -> FtpSourceProvider.selectSingleRemoteFile(ftpClient, "/upload", null));

        assertTrue(error.getMessage().contains("requires 'fileNameTemplate'"));
        assertTrue(error.getMessage().contains("/upload"));
    }

    // --- camino feliz: un archivo real se selecciona con su nombre ---

    @Test
    void conArchivoExistenteDevuelveElSeleccionadoConNombre() throws Exception {
        var ftpClient = mock(FTPClient.class);
        when(ftpClient.changeWorkingDirectory("/upload/mt101.csv")).thenReturn(false);

        var selected = FtpSourceProvider.selectSingleRemoteFile(ftpClient, "/upload/mt101.csv", null);

        assertEquals("mt101.csv", selected.name());
        assertEquals("/upload/mt101.csv", selected.location());
    }
}
