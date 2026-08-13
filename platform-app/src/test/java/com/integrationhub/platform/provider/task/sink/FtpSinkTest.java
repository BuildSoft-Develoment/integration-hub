package com.integrationhub.platform.provider.task.sink;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Mismo alcance que {@code SftpSinkTest}: la config se valida ANTES de abrir la conexion, asi que eso se
 * puede probar sin servidor. El camino feliz (upload + rename) se verifica contra el FTP real del stack de
 * integracion, igual que el de la fuente FTP.
 */
class FtpSinkTest {

    @Test
    void tipoEsFtp() {
        assertEquals("FTP", new FtpSink().type());
    }

    @Test
    void sinHostFallaAntesDeTocarLaRed() {
        var error = assertThrows(IllegalArgumentException.class,
                () -> new FtpSink().deliver("/out/x.csv", () -> new ByteArrayInputStream(new byte[0]),
                        Map.of("username", "u", "password", "p")));
        assertTrue(error.getMessage().contains("host"), error.getMessage());
    }

    @Test
    void laContrasenaEsObligatoria() {
        // FTP no tiene el camino de clave privada que si tiene SFTP: sin password no hay forma de
        // autenticar, y dejarlo pasar solo aplaza el fallo hasta el login.
        var error = assertThrows(IllegalArgumentException.class,
                () -> new FtpSink().deliver("/out/x.csv", () -> new ByteArrayInputStream(new byte[0]),
                        Map.of("host", "h", "username", "u")));
        assertTrue(error.getMessage().contains("password"), error.getMessage());
    }
}
