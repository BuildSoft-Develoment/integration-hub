package com.integrationhub.platform.provider.task.payments.swift.transport;

import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-004, RF-017, T-018
 *
 * <p>Usa Testcontainers con la imagen {@code atmoz/sftp} para tener un servidor SFTP
 * real en un contenedor efimero. Verifica que el transporte sube el archivo via
 * upload-with-rename y produce {@link com.integrationhub.platform.provider.task.payments.spi.TransportResult}
 * exitoso.</p>
 */
@Testcontainers
class SftpPaymentTransportTest {

    private static final String SFTP_USER = "swift";
    private static final String SFTP_PASSWORD = "swift123";

    @Container
    static final GenericContainer<?> SFTP = new GenericContainer<>("atmoz/sftp:alpine")
            .withExposedPorts(22)
            // atmoz/sftp chroots al $HOME del usuario; el segmento ":upload" crea el
            // directorio writable /home/<user>/upload que el cliente SFTP ve como /upload.
            .withCommand(SFTP_USER + ":" + SFTP_PASSWORD + ":1001:100:upload")
            .waitingFor(Wait.forListeningPort());

    private SftpPaymentTransport transport;

    @BeforeEach
    void setUp() {
        transport = new SftpPaymentTransport();
    }

    @AfterAll
    static void stopContainer() {
        SFTP.stop();
    }

    @Test
    void uploadsRawPayloadWithRenameAndReturnsAccepted() throws Exception {
        var message = sampleMessage("PROC-SFTP-001");
        var configuration = configurationFor("/upload/mt101-${sendersReference}.json");

        var result = transport.send(message, configuration);

        assertTrue(result.accepted(), () -> "expected accepted, lastError=" + result.lastError());
        assertEquals(1, result.attempts());
        assertEquals("/upload/mt101-PROC-SFTP-001.json", result.gatewayReference());

        // Verifica que el archivo existe en el sftp (rename completo, sin .part).
        var content = readFile("/upload/mt101-PROC-SFTP-001.json");
        assertEquals(message.rawPayload(), content);
        // Verifica que NO existe el .part residual.
        assertThrows(Exception.class, () -> readFile("/upload/mt101-PROC-SFTP-001.json.part"));
    }

    @Test
    void appliesCustomTmpExtension() throws Exception {
        var message = sampleMessage("PROC-TMP");
        var cfg = configurationFor("/upload/${sendersReference}.fin");
        @SuppressWarnings("unchecked")
        var sftpCfg = new LinkedHashMap<>((Map<String, Object>) cfg.get("sftp"));
        sftpCfg.put("tmpExtension", ".tmp-uploading");
        cfg.put("sftp", sftpCfg);

        var result = transport.send(message, cfg);
        assertTrue(result.accepted());
        // Verifica que el archivo final esta sin extension temp.
        assertNotNull(readFile("/upload/PROC-TMP.fin"));
    }

    @Test
    void rejectsWhenSftpConfigMissing() {
        var error = assertThrows(IllegalArgumentException.class,
                () -> transport.send(sampleMessage("X"), Map.of()));
        assertTrue(error.getMessage().contains("configuration.sftp"));
    }

    @Test
    void rejectsWhenHostMissing() {
        var error = assertThrows(IllegalArgumentException.class,
                () -> transport.send(sampleMessage("X"),
                        Map.of("sftp", Map.of("username", "u", "dropPathTemplate", "/x"))));
        assertTrue(error.getMessage().contains("sftp.host"));
    }

    @Test
    void rejectsWhenDropPathTemplateMissing() {
        var error = assertThrows(IllegalArgumentException.class,
                () -> transport.send(sampleMessage("X"),
                        Map.of("sftp", Map.of("host", "h", "username", "u"))));
        assertTrue(error.getMessage().contains("sftp.dropPathTemplate"));
    }

    @Test
    void rejectsWithoutThrowingWhenSshFails() {
        var configuration = new LinkedHashMap<String, Object>();
        configuration.put("sftp", Map.of(
                "host", "127.0.0.1",
                "port", 1,  // puerto inutil
                "username", "x",
                "password", "y",
                "dropPathTemplate", "/x",
                "timeoutMillis", 500));
        configuration.put("retryPolicy", Map.of("maxRetries", 0));
        var result = transport.send(sampleMessage("BAD"), configuration);
        assertFalse(result.accepted());
        assertNotNull(result.lastError());
        assertTrue(result.lastError().toLowerCase().contains("sftp")
                || result.lastError().toLowerCase().contains("jschexception"));
    }

    @Test
    void retriesUploadAccordingToRetryPolicy() {
        // Puerto cerrado: cada intento falla rapido; con maxRetries=2 el
        // transporte debe reportar 3 intentos (paridad con el retry de REST).
        var configuration = new LinkedHashMap<String, Object>();
        configuration.put("sftp", Map.of(
                "host", "127.0.0.1",
                "port", 1,
                "username", "x",
                "password", "y",
                "dropPathTemplate", "/x",
                "timeoutMillis", 300));
        configuration.put("retryPolicy", Map.of(
                "maxRetries", 2,
                "backoffStrategy", "constant",
                "initialBackoffSeconds", 0));
        var result = transport.send(sampleMessage("RETRY"), configuration);
        assertFalse(result.accepted());
        assertEquals(3, result.attempts(), "maxRetries=2 => 3 intentos en total");
        assertNotNull(result.lastError());
    }

    @Test
    void transportIdIsSftp() {
        assertEquals("SFTP", transport.transport());
    }

    // --- helpers ---

    private LinkedHashMap<String, Object> configurationFor(String dropPathTemplate) {
        var cfg = new LinkedHashMap<String, Object>();
        cfg.put("transport", "SFTP");
        cfg.put("sftp", new LinkedHashMap<String, Object>(Map.of(
                "host", SFTP.getHost(),
                "port", SFTP.getMappedPort(22),
                "username", SFTP_USER,
                "password", SFTP_PASSWORD,
                "strictHostKeyChecking", false,
                "timeoutMillis", 15000,
                "dropPathTemplate", dropPathTemplate)));
        return cfg;
    }

    private Mt101Message sampleMessage(String sendersReference) {
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", null, "N"),
                new Mt101Message.SequenceA(sendersReference, null, 1, 1, LocalDate.of(2026, 6, 9),
                        null, null, null, null),
                List.of(new Mt101Message.Transaction(
                        1, "TX-1", null, null,
                        new Mt101Message.Amount("PEN", new BigDecimal("100.00")),
                        null, null, null, null,
                        new Mt101Message.Party("", "ACC", null, List.of()),
                        null, null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("100.00"))),
                "{\"sendersReference\":\"" + sendersReference + "\",\"transactions\":1}",
                "JSON");
    }

    private String readFile(String path) throws Exception {
        Session session = null;
        ChannelSftp channel = null;
        try {
            var jsch = new JSch();
            session = jsch.getSession(SFTP_USER, SFTP.getHost(), SFTP.getMappedPort(22));
            session.setPassword(SFTP_PASSWORD);
            var props = new Properties();
            props.put("StrictHostKeyChecking", "no");
            session.setConfig(props);
            session.connect(5000);
            channel = (ChannelSftp) session.openChannel("sftp");
            channel.connect(5000);
            try (var out = new ByteArrayOutputStream();
                 var in = channel.get(path)) {
                in.transferTo(out);
                return out.toString(java.nio.charset.StandardCharsets.UTF_8);
            }
        } finally {
            if (channel != null && channel.isConnected()) channel.disconnect();
            if (session != null && session.isConnected()) session.disconnect();
        }
    }
}
