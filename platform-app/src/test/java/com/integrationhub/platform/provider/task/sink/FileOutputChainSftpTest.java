package com.integrationhub.platform.provider.task.sink;

// @trace ADR-016 (E2E de la capa de salida: FILE_WRITE -> FILE_COMPRESS -> FILE_DELIVER contra un SFTP real)

import com.integrationhub.platform.provider.task.compress.ZipCompressor;
import com.integrationhub.platform.provider.task.writer.CsvWriter;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.task.compress.CompressionEntry;
import com.integrationhub.platform.spi.task.compress.CompressionOptions;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import net.lingala.zip4j.ZipFile;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * E2E byte a byte de la capa de salida ADR-016 contra un SFTP <b>real</b> (Testcontainers {@code atmoz/sftp},
 * mismo harness que {@code SftpPaymentTransportTest}): el {@link CsvWriter} genera el CSV (con formateo por tipo y
 * redondeo HALF_UP), el {@link ZipCompressor} lo comprime (plano y AES-256), y el {@link SftpSink} lo entrega por
 * SFTP con upload-con-temporal-y-rename. Luego se descarga, se descomprime y se verifica el contenido exacto —
 * cerrando el hueco de que la entrega SFTP real no tenia cobertura end-to-end.
 */
@Testcontainers
class FileOutputChainSftpTest {

    private static final String SFTP_USER = "bank";
    private static final String SFTP_PASSWORD = "bank123";
    private static final String ZIP_PASSWORD = "s3cr3t-aes";

    // CSV esperado: header, 2 detalles (monto 0.00 HALF_UP: 1000.505 -> 1000.51 ; fecha yyyyMMdd), trailer.
    private static final String EXPECTED_CSV =
            "H,2\nTX-001,1000.51,20260719\nTX-002,2500.00,20260720\nT,2\n";

    @Container
    static final GenericContainer<?> SFTP = new GenericContainer<>("atmoz/sftp:alpine")
            .withExposedPorts(22)
            .withCommand(SFTP_USER + ":" + SFTP_PASSWORD + ":1001:100:inbox")
            .waitingFor(Wait.forListeningPort());

    @AfterAll
    static void stopContainer() {
        SFTP.stop();
    }

    @Test
    void writeCompressDeliverPlainZipRoundTrips() throws Exception {
        var csvBytes = writeCsv();
        var zipBytes = zip(csvBytes, CompressionOptions.plain(6)); // plano (sin cifrar)

        new SftpSink().deliver("/inbox/export.csv.zip", () -> new ByteArrayInputStream(zipBytes), sftpConfig());

        // El archivo final existe (rename completo, sin .part residual).
        assertThrows(Exception.class, () -> readBytes("/inbox/export.csv.zip.part"));
        var downloaded = readBytes("/inbox/export.csv.zip");
        assertEquals(EXPECTED_CSV, unzipPlainEntry(downloaded, "export.csv"));
    }

    @Test
    void writeCompressDeliverAes256ZipRoundTrips() throws Exception {
        var csvBytes = writeCsv();
        var zipBytes = zip(csvBytes, CompressionOptions.encrypted(ZIP_PASSWORD.toCharArray(), 6)); // AES-256

        new SftpSink().deliver("/inbox/export-enc.csv.zip", () -> new ByteArrayInputStream(zipBytes), sftpConfig());

        var downloaded = readBytes("/inbox/export-enc.csv.zip");
        assertEquals(EXPECTED_CSV, extractAesEntry(downloaded, "export.csv"));
    }

    // --- cadena de salida ---

    private static byte[] writeCsv() throws Exception {
        var config = Map.<String, Object>of("layout", Map.of("detail", Map.of(
                "delimiter", ",",
                "columns", List.of(
                        Map.of("field", "ref"),
                        Map.of("field", "monto", "type", "NUMBER", "format", "0.00"),
                        Map.of("field", "fecha", "type", "DATE", "format", "yyyyMMdd")))));
        var out = new ByteArrayOutputStream();
        try (var session = new CsvWriter().open(out, config)) {
            session.writeHeader(List.of("H", "2"));
            session.writeDetail(List.of(
                    new ReadRecord(Map.of("ref", "TX-001", "monto", "1000.505", "fecha", "2026-07-19")),
                    new ReadRecord(Map.of("ref", "TX-002", "monto", "2500", "fecha", "2026-07-20"))));
            session.writeTrailer(List.of("T", "2"));
        }
        return out.toByteArray();
    }

    private static byte[] zip(byte[] csvBytes, CompressionOptions options) throws Exception {
        var out = new ByteArrayOutputStream();
        new ZipCompressor().compress(
                List.of(new CompressionEntry("export.csv", () -> new ByteArrayInputStream(csvBytes))),
                out, options);
        return out.toByteArray();
    }

    // --- verificacion ---

    private static String unzipPlainEntry(byte[] zipBytes, String entryName) throws Exception {
        try (var zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entryName.equals(entry.getName())) {
                    var buffer = new ByteArrayOutputStream();
                    zis.transferTo(buffer);
                    return buffer.toString(StandardCharsets.UTF_8);
                }
            }
        }
        throw new AssertionError("entry not found in zip: " + entryName);
    }

    private static String extractAesEntry(byte[] zipBytes, String entryName) throws Exception {
        var tempZip = Files.createTempFile("chain-enc", ".zip");
        var destDir = Files.createTempDirectory("chain-enc-out");
        try {
            Files.write(tempZip, zipBytes);
            try (var zipFile = new ZipFile(tempZip.toFile(), ZIP_PASSWORD.toCharArray())) {
                zipFile.extractAll(destDir.toString());
            }
            return Files.readString(destDir.resolve(entryName), StandardCharsets.UTF_8);
        } finally {
            Files.deleteIfExists(tempZip);
            Files.walk(destDir).map(java.nio.file.Path::toFile).forEach(java.io.File::delete);
        }
    }

    private static Map<String, Object> sftpConfig() {
        return Map.of(
                "host", SFTP.getHost(),
                "port", SFTP.getMappedPort(22),
                "username", SFTP_USER,
                "password", SFTP_PASSWORD,
                "strictHostKeyChecking", false,
                "timeoutMillis", 15000);
    }

    private static byte[] readBytes(String path) throws Exception {
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
            try (var out = new ByteArrayOutputStream(); var in = channel.get(path)) {
                in.transferTo(out);
                return out.toByteArray();
            }
        } finally {
            if (channel != null && channel.isConnected()) channel.disconnect();
            if (session != null && session.isConnected()) session.disconnect();
        }
    }
}
