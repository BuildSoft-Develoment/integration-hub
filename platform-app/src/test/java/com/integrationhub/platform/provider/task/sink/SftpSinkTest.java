package com.integrationhub.platform.provider.task.sink;

import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.SftpATTRS;
import com.jcraft.jsch.SftpException;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.io.ByteArrayInputStream;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SftpSinkTest {

    @Test
    void typeIsSftp() {
        assertEquals("SFTP", new SftpSink().type());
    }

    @Test
    void requiresHost() {
        // valida la config antes de tocar la red (fail-fast, sin conexion real)
        assertThrows(IllegalArgumentException.class,
                () -> new SftpSink().deliver("/out/x.csv",
                        () -> new ByteArrayInputStream(new byte[0]), Map.of("username", "u")));
    }

    // --- orden de rename/rm: lo que decide si una entrega anterior sobrevive a un fallo ---

    @Test
    void conElDestinoLibreRenombraYNoBorraNada() throws Exception {
        var channel = mock(ChannelSftp.class);

        SftpSink.renameOverwriting(channel, "/out/x.csv.part", "/out/x.csv");

        verify(channel).rename("/out/x.csv.part", "/out/x.csv");
        verify(channel, never()).rm(any());
    }

    @Test
    void conElDestinoOcupadoLoBorraSoloDespuesDeQueElRenameFalle() throws Exception {
        // El orden importa mas de lo que parece: borrar ANTES de saber si el rename funciona —que es
        // como estaba— deja el directorio del banco sin la entrega anterior Y sin la nueva si el rename
        // falla justo despues. Aqui el borrado solo ocurre cuando ya se sabe que el destino estorba.
        var channel = mock(ChannelSftp.class);
        doThrow(new SftpException(4, "file exists")).doNothing()
                .when(channel).rename("/out/x.csv.part", "/out/x.csv");
        when(channel.stat("/out/x.csv")).thenReturn(mock(SftpATTRS.class));

        SftpSink.renameOverwriting(channel, "/out/x.csv.part", "/out/x.csv");

        InOrder orden = inOrder(channel);
        orden.verify(channel).rename("/out/x.csv.part", "/out/x.csv");
        orden.verify(channel).rm("/out/x.csv");
        orden.verify(channel).rename("/out/x.csv.part", "/out/x.csv");
    }

    @Test
    void siElRenameFallaSinQueElDestinoExistaNoSeBorraNada() throws Exception {
        // El fallo no era colision (permisos, ruta que no existe...). Borrar "por si acaso" volveria a
        // abrir el mismo agujero por otra puerta.
        var channel = mock(ChannelSftp.class);
        var permisos = new SftpException(3, "permission denied");
        doThrow(permisos).when(channel).rename("/out/x.csv.part", "/out/x.csv");
        when(channel.stat("/out/x.csv")).thenThrow(new SftpException(2, "no such file"));

        var propagado = assertThrows(SftpException.class,
                () -> SftpSink.renameOverwriting(channel, "/out/x.csv.part", "/out/x.csv"));

        assertSame(permisos, propagado, "debe propagarse el fallo original, no el del stat");
        verify(channel, never()).rm(any());
    }
}
