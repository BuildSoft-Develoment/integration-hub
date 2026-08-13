package com.integrationhub.platform.provider.source;

import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.SftpATTRS;
import com.jcraft.jsch.SftpException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

// @covers spec 001-catalogo-fuentes RF-005: seleccion de archivo unico SFTP (sin fileNameTemplate)
class SftpSourceProviderTest {

    // --- guard de directorio: remotePath="/" reventaba con NPE al derivar el nombre ---

    @Test
    void conRemotePathRaizSinTemplateFallaConMensajeAccionable() throws Exception {
        var channel = mock(ChannelSftp.class);
        var attrs = mock(SftpATTRS.class);
        when(channel.stat("/")).thenReturn(attrs);
        when(attrs.isDir()).thenReturn(true);

        var error = assertThrows(IllegalStateException.class,
                () -> SftpSourceProvider.selectSingleRemoteFile(channel, "/", null));

        assertTrue(error.getMessage().contains("requires 'fileNameTemplate'"),
                "el mensaje debe decir que un directorio exige fileNameTemplate: " + error.getMessage());
        assertTrue(error.getMessage().contains("/"), "el mensaje debe incluir la ruta ofensora");
    }

    @Test
    void conRemotePathDirectorioSinTemplateFallaConMensajeAccionable() throws Exception {
        var channel = mock(ChannelSftp.class);
        var attrs = mock(SftpATTRS.class);
        when(channel.stat("/upload")).thenReturn(attrs);
        when(attrs.isDir()).thenReturn(true);

        var error = assertThrows(IllegalStateException.class,
                () -> SftpSourceProvider.selectSingleRemoteFile(channel, "/upload", null));

        assertTrue(error.getMessage().contains("requires 'fileNameTemplate'"));
        assertTrue(error.getMessage().contains("/upload"));
    }

    // --- 015: la ruta remota debe existir (fail-loud, no solo usuario/clave) ---

    @Test
    void conRutaInexistenteFallaConRemotePathNotFound() throws Exception {
        var channel = mock(ChannelSftp.class);
        when(channel.stat("/no-existe.txt")).thenThrow(new SftpException(2, "no such file"));

        var error = assertThrows(IllegalStateException.class,
                () -> SftpSourceProvider.selectSingleRemoteFile(channel, "/no-existe.txt", null));

        assertTrue(error.getMessage().contains("Remote path not found"));
        assertTrue(error.getMessage().contains("/no-existe.txt"));
    }

    // --- camino feliz: un archivo real se selecciona con su nombre ---

    @Test
    void conArchivoExistenteDevuelveElSeleccionadoConNombre() throws Exception {
        var channel = mock(ChannelSftp.class);
        var attrs = mock(SftpATTRS.class);
        when(channel.stat("/upload/mt101.csv")).thenReturn(attrs);
        when(attrs.isDir()).thenReturn(false);

        var selected = SftpSourceProvider.selectSingleRemoteFile(channel, "/upload/mt101.csv", null);

        assertEquals("mt101.csv", selected.name());
        assertEquals("/upload/mt101.csv", selected.location());
    }

    @Test
    void aceptaNombresRemotosQueWindowsConsideraIlegales() throws Exception {
        // SFTP admite nombres con *, ? o : que Path.of() rechaza en una JVM Windows
        // (InvalidPathException); el nombre se deriva por substring, no por Path.
        var channel = mock(ChannelSftp.class);
        var attrs = mock(SftpATTRS.class);
        when(channel.stat("/upload/informe*2026?.txt")).thenReturn(attrs);
        when(attrs.isDir()).thenReturn(false);

        var selected = SftpSourceProvider.selectSingleRemoteFile(channel, "/upload/informe*2026?.txt", null);

        assertEquals("informe*2026?.txt", selected.name());
    }
}
