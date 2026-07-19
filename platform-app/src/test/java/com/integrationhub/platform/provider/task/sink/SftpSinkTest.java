package com.integrationhub.platform.provider.task.sink;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

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
}
