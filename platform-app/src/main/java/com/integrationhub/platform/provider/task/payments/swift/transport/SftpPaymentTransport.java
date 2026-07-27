package com.integrationhub.platform.provider.task.payments.swift.transport;

import com.integrationhub.platform.provider.task.payments.swift.Mt101PaymentCorrelation;
import com.integrationhub.vertical.swift.mt101.spi.PaymentMessageTransport;
import com.integrationhub.vertical.swift.mt101.spi.PreDispatchTransportException;
import com.integrationhub.vertical.swift.mt101.spi.TransportResult;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpException;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Properties;

/**
 * Transporte SFTP para {@code MT101_PAY}.
 *
 * <p>Sube el {@code rawPayload} ya formateado al sftp del banco siguiendo el
 * patron upload-with-rename:</p>
 * <ol>
 *   <li>Sube a {@code &lt;dropPath&gt;.part} (o {@code tmpExtension} configurable).</li>
 *   <li>Rename atomico a {@code &lt;dropPath&gt;}. El banco solo ve archivos
 *       completos; nunca lee un upload en progreso.</li>
 * </ol>
 *
 * <p><b>Retry</b>: reintenta la subida completa (conexion + put + rename) segun
 * {@code configuration.retryPolicy} — mismo shape que el transporte REST
 * ({@code maxRetries}, {@code backoffStrategy} constant/exponential,
 * {@code initialBackoffSeconds}, {@code maxBackoffSeconds}). El patron
 * upload-with-rename hace el retry seguro: un {@code .part} huerfano de un
 * intento fallido se sobreescribe en el siguiente y el banco nunca ve el
 * archivo final hasta el rename.</p>
 *
 * <p><b>Configuracion (sub-bloque {@code sftp})</b>:</p>
 * <pre>
 * sftp: {
 *   host: "sftp.banco.local",
 *   port: 22,
 *   username: "...",
 *   password: "${secret:sftp_pass}",   // o privateKeyPath/passphrase
 *   privateKeyPath: "/etc/keys/id_rsa",
 *   passphrase: "${secret:sftp_passphrase}",
 *   dropPathTemplate: "/in/mt101/${sendersReference}.xml",
 *   tmpExtension: ".part",
 *   strictHostKeyChecking: true,
 *   knownHostsPath: "/etc/ssh/ssh_known_hosts",
 *   timeoutMillis: 15000
 * },
 * retryPolicy: { maxRetries: 5, backoffStrategy: "exponential",
 *                initialBackoffSeconds: 30, maxBackoffSeconds: 900 }
 * </pre>
 *
 * @trace spec 008-mensajeria-pagos RF-004, RF-017, T-018
 * @trace ADR-009
 */
@ApplicationScoped
public class SftpPaymentTransport implements PaymentMessageTransport {

    public static final String TRANSPORT_ID = "SFTP";
    private static final String DEFAULT_TMP_EXTENSION = ".part";
    private static final String DEFAULT_DUPLICATE_POLICY = "SKIP_IF_SAME_HASH";
    private static final int DEFAULT_TIMEOUT_MILLIS = 15000;
    private static final int DEFAULT_PORT = 22;
    private static final int DEFAULT_MAX_RETRIES = 5;
    private static final long DEFAULT_INITIAL_BACKOFF_SECONDS = 30L;
    private static final long DEFAULT_MAX_BACKOFF_SECONDS = 900L;

    @Override
    public String transport() {
        return TRANSPORT_ID;
    }

    @Override
    public TransportResult send(Mt101Message message, Map<String, Object> configuration) {
        var retry = retryPolicy(configuration.get("retryPolicy"));
        var startedAt = System.currentTimeMillis();
        String lastError = null;
        // STICKY: si CUALQUIER intento quedo INCIERTO (el upload/rename del archivo final ya habia comenzado y la
        // red fallo: pudo llegar al banco), el resultado final NUNCA baja de INCIERTO. No se degrada a re-solicitable
        // (transportFailure) ni a rechazo reusable aunque un intento POSTERIOR falle pre-despacho: "si alguna vez
        // pudimos enviar, no lo re-pagamos a ciegas" (evita doble pago via re-solicitud de tanda-4).
        boolean anyUncertain = false;
        String uncertainError = null;
        // D.2: marca si el ultimo fallo fue de TRANSPORTE/AUTH antes del despacho (el banco no recibio nada) ->
        // re-solicitable (transportFailure), distinto de un rechazo de negocio (duplicado/hash, politica FAIL).
        // Solo aplica si NUNCA hubo un intento incierto.
        boolean lastRetriable = false;
        for (int attempt = 1; attempt <= retry.maxRetries() + 1; attempt++) {
            var result = attemptUpload(message, configuration);
            if (result.accepted()) {
                return TransportResult.accepted(result.gatewayReference(), attempt,
                        System.currentTimeMillis() - startedAt);
            }
            lastError = result.lastError();
            if (result.uncertain()) {
                anyUncertain = true;
                uncertainError = result.lastError();
            }
            lastRetriable = result.retriable();
            if (attempt <= retry.maxRetries()) {
                sleepBackoff(retry, attempt);
            }
        }
        // Reintentos agotados: uncertain es STICKY (si alguna vez pudo llegar, NO se reporta como rechazo ni como
        // re-solicitable: se resuelve por verificacion remota/STATUS). Si NUNCA hubo incierto y el ultimo fallo fue
        // de transporte/auth (pre-despacho), es re-solicitable (D.2); si no, rechazo de negocio del banco.
        if (anyUncertain) {
            return TransportResult.uncertain(retry.maxRetries() + 1,
                    System.currentTimeMillis() - startedAt, uncertainError);
        }
        return lastRetriable
                ? TransportResult.transportFailure(retry.maxRetries() + 1,
                        System.currentTimeMillis() - startedAt, lastError)
                : TransportResult.rejected(retry.maxRetries() + 1,
                        System.currentTimeMillis() - startedAt, lastError);
    }

    // Package-private (no private) para que los tests puedan scriptear la secuencia de resultados por-intento y
    // verificar la agregacion sticky del loop de reintentos (uncertain -> retriable debe quedar uncertain).
    TransportResult attemptUpload(Mt101Message message, Map<String, Object> configuration) {
        var sftpCfg = mapValue(configuration.get("sftp"));
        if (sftpCfg.isEmpty()) {
            throw new PreDispatchTransportException("MT101_PAY transport=SFTP requires configuration.sftp");
        }
        var host = stringRequired(sftpCfg.get("host"), "sftp.host");
        var port = intValue(sftpCfg.get("port"), DEFAULT_PORT);
        var username = stringRequired(sftpCfg.get("username"), "sftp.username");
        var password = stringOrNull(sftpCfg.get("password"));
        var privateKeyPath = stringOrNull(sftpCfg.get("privateKeyPath"));
        var passphrase = stringOrNull(sftpCfg.get("passphrase"));
        var timeoutMillis = intValue(sftpCfg.get("timeoutMillis"), DEFAULT_TIMEOUT_MILLIS);
        var strictHostKeyChecking = boolValue(sftpCfg.get("strictHostKeyChecking"), true);
        var knownHostsPath = stringOrNull(sftpCfg.get("knownHostsPath"));
        var dropPathTemplate = stringRequired(sftpCfg.get("dropPathTemplate"), "sftp.dropPathTemplate");
        var tmpExtension = stringValue(sftpCfg.get("tmpExtension"), DEFAULT_TMP_EXTENSION);
        var duplicatePolicy = stringValue(sftpCfg.get("remoteDuplicatePolicy"), DEFAULT_DUPLICATE_POLICY)
                .toUpperCase(java.util.Locale.ROOT);
        var dropPath = resolveTemplate(dropPathTemplate, message);
        var tmpPath = dropPath + tmpExtension;

        var startedAt = System.currentTimeMillis();
        Session session = null;
        ChannelSftp channel = null;
        // Frontera de seguridad de dinero: hasta aqui (connect/stat/get) cualquier fallo es seguro
        // de reintentar/reenviar (el archivo final nunca se toco). En cuanto empieza el put/rename
        // del archivo destino, un error de red ya NO permite afirmar que el banco no lo recibio.
        boolean dispatchStarted = false;
        try {
            var jsch = new JSch();
            if (knownHostsPath != null) {
                jsch.setKnownHosts(knownHostsPath);
            }
            if (privateKeyPath != null) {
                if (passphrase != null) {
                    jsch.addIdentity(privateKeyPath, passphrase);
                } else {
                    jsch.addIdentity(privateKeyPath);
                }
            }
            session = jsch.getSession(username, host, port);
            if (password != null) {
                session.setPassword(password);
            }
            var properties = new Properties();
            properties.put("StrictHostKeyChecking", strictHostKeyChecking ? "yes" : "no");
            session.setConfig(properties);
            session.connect(timeoutMillis);

            channel = (ChannelSftp) session.openChannel("sftp");
            channel.connect(timeoutMillis);

            var rawPayload = message.rawPayload();
            if (rawPayload == null) {
                throw new IllegalStateException("Mt101Message.rawPayload is required for SFTP send");
            }
            var bytes = rawPayload.getBytes(StandardCharsets.UTF_8);

            // Idempotencia remota (H4): si el archivo final ya existe en el banco
            // (e.g. crash post-rename/pre-SENT y luego retry), la politica decide.
            var existing = statRemote(channel, dropPath);
            if (existing != null) {
                var durationMs = System.currentTimeMillis() - startedAt;
                switch (duplicatePolicy) {
                    case "SKIP_IF_SAME_HASH" -> {
                        if (existing.getSize() != bytes.length) {
                            return TransportResult.rejected(1, durationMs,
                                    "SFTP remote file " + dropPath + " exists with different size ("
                                            + existing.getSize() + " vs " + bytes.length
                                            + "); manual review required");
                        }
                        try (var remoteInput = channel.get(dropPath)) {
                            if (sha256Hex(remoteInput).equals(sha256Hex(bytes))) {
                                // Mismo contenido: el banco ya tiene el archivo final.
                                // Tratamos como aceptado idempotente, no re-subimos.
                                return TransportResult.accepted(dropPath, 1, durationMs);
                            }
                        }
                        return TransportResult.rejected(1, durationMs,
                                "SFTP remote file " + dropPath
                                        + " exists with different hash; manual review required");
                    }
                    case "FAIL" -> {
                        return TransportResult.rejected(1, durationMs,
                                "SFTP remote file already exists: " + dropPath
                                        + " (remoteDuplicatePolicy=FAIL)");
                    }
                    case "RENAME_WITH_SUFFIX" -> {
                        dropPath = dropPath + "." + System.currentTimeMillis();
                    }
                    case "OVERWRITE" -> {
                        // continua: el put/rename sobrescribe.
                    }
                    default -> throw new PreDispatchTransportException(
                            "Unknown sftp.remoteDuplicatePolicy: " + duplicatePolicy
                                    + " (expected SKIP_IF_SAME_HASH, FAIL, OVERWRITE, RENAME_WITH_SUFFIX)");
                }
            }

            // A partir de aqui el despacho del archivo final esta en curso: un fallo de red ya no
            // es un rechazo seguro sino INCIERTO (el .part o el rename pudieron completarse).
            dispatchStarted = true;
            // Upload with temporary extension, then atomic rename.
            try (var input = new ByteArrayInputStream(bytes)) {
                channel.put(input, tmpPath, ChannelSftp.OVERWRITE);
            }
            // rm del destino si OVERWRITE y existia (rename no pisa en algunos servidores).
            if (existing != null && "OVERWRITE".equals(duplicatePolicy)) {
                try {
                    channel.rm(dropPath);
                } catch (SftpException ignored) {
                    // el rename siguiente fallara y se reportara; no enmascaramos.
                }
            }
            channel.rename(tmpPath, dropPath);

            var durationMs = System.currentTimeMillis() - startedAt;
            // Gateway reference: para SFTP no hay respuesta; usamos el dropPath final.
            return TransportResult.accepted(dropPath, 1, durationMs);
        } catch (JSchException | SftpException | java.io.IOException error) {
            var durationMs = System.currentTimeMillis() - startedAt;
            var detail = "SFTP " + error.getClass().getSimpleName() + ": " + error.getMessage();
            // Sin fallback por texto del error: la clasificacion es por FASE. Antes del despacho
            // (connect/auth/stat) = fallo de TRANSPORTE (el banco no recibio nada) -> re-solicitable
            // (transportFailure -> INVALIDATED), NO un rechazo de negocio del banco. Durante/despues del
            // put/rename = UNCERTAIN, que el lifecycle nunca reenvia a ciegas (se resuelve verificando el
            // dropPath remoto / STATUS). Los rechazos legitimos (duplicado/hash, politica FAIL) NO pasan por
            // aqui: se devuelven como rejected() explicito antes del despacho.
            return dispatchStarted
                    ? TransportResult.uncertain(1, durationMs, detail)
                    : TransportResult.transportFailure(1, durationMs, detail);
        } finally {
            if (channel != null && channel.isConnected()) {
                channel.disconnect();
            }
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /** {@code stat} del archivo remoto; {@code null} si no existe. */
    private com.jcraft.jsch.SftpATTRS statRemote(ChannelSftp channel, String path) {
        try {
            return channel.stat(path);
        } catch (SftpException notFound) {
            return null;
        }
    }

    private String sha256Hex(byte[] bytes) {
        var digest = sha256();
        return HexFormat.of().formatHex(digest.digest(bytes));
    }

    private String sha256Hex(InputStream input) throws java.io.IOException {
        var digest = sha256();
        var buffer = new byte[8192];
        int read;
        while ((read = input.read(buffer)) >= 0) {
            digest.update(buffer, 0, read);
        }
        return HexFormat.of().formatHex(digest.digest());
    }

    private MessageDigest sha256() {
        try {
            return MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 digest is not available", error);
        }
    }

    private String resolveTemplate(String template, Mt101Message message) {
        return Mt101PaymentCorrelation.resolveTemplate(template, message);
    }

    private RetryPolicy retryPolicy(Object raw) {
        var cfg = mapValue(raw);
        return new RetryPolicy(
                intValue(cfg.get("maxRetries"), DEFAULT_MAX_RETRIES),
                stringValue(cfg.get("backoffStrategy"), "exponential"),
                longValue(cfg.get("initialBackoffSeconds"), DEFAULT_INITIAL_BACKOFF_SECONDS),
                longValue(cfg.get("maxBackoffSeconds"), DEFAULT_MAX_BACKOFF_SECONDS));
    }

    private void sleepBackoff(RetryPolicy retry, int attempt) {
        try {
            Thread.sleep(retry.backoffSeconds(attempt) * 1000L);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
    }

    record RetryPolicy(int maxRetries, String backoffStrategy,
                       long initialBackoffSeconds, long maxBackoffSeconds) {
        long backoffSeconds(int attempt) {
            if ("constant".equalsIgnoreCase(backoffStrategy)) {
                return Math.min(initialBackoffSeconds, maxBackoffSeconds);
            }
            var exponential = initialBackoffSeconds * (1L << Math.min(attempt - 1, 20));
            return Math.min(exponential, maxBackoffSeconds);
        }
    }

    private long longValue(Object raw, long defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Long.parseLong(String.valueOf(raw));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapValue(Object raw) {
        if (!(raw instanceof Map<?, ?> rawMap)) {
            return Map.of();
        }
        var result = new LinkedHashMap<String, Object>();
        rawMap.forEach((key, value) -> result.put(String.valueOf(key), value));
        return result;
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw);
        return value.isBlank() ? defaultValue : value;
    }

    private String stringOrNull(Object raw) {
        if (raw == null) {
            return null;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? null : value;
    }

    private String stringRequired(Object raw, String fieldName) {
        var value = stringOrNull(raw);
        if (value == null) {
            throw new PreDispatchTransportException("MT101_PAY transport=SFTP requires configuration." + fieldName);
        }
        return value;
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(raw));
    }

    private boolean boolValue(Object raw, boolean defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        return Boolean.parseBoolean(String.valueOf(raw));
    }
}
