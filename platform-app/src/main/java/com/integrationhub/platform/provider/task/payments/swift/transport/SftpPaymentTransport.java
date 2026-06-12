package com.integrationhub.platform.provider.task.payments.swift.transport;

import com.integrationhub.platform.provider.task.payments.spi.PaymentMessageTransport;
import com.integrationhub.platform.provider.task.payments.spi.TransportResult;
import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpException;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
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
        for (int attempt = 1; attempt <= retry.maxRetries() + 1; attempt++) {
            var result = attemptUpload(message, configuration);
            if (result.accepted()) {
                return TransportResult.accepted(result.gatewayReference(), attempt,
                        System.currentTimeMillis() - startedAt);
            }
            lastError = result.lastError();
            if (attempt <= retry.maxRetries()) {
                sleepBackoff(retry, attempt);
            }
        }
        return TransportResult.rejected(retry.maxRetries() + 1,
                System.currentTimeMillis() - startedAt, lastError);
    }

    private TransportResult attemptUpload(Mt101Message message, Map<String, Object> configuration) {
        var sftpCfg = mapValue(configuration.get("sftp"));
        if (sftpCfg.isEmpty()) {
            throw new IllegalArgumentException("MT101_PAY transport=SFTP requires configuration.sftp");
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
        var dropPath = resolveTemplate(dropPathTemplate, message);
        var tmpPath = dropPath + tmpExtension;

        var startedAt = System.currentTimeMillis();
        Session session = null;
        ChannelSftp channel = null;
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

            // Upload with temporary extension.
            var rawPayload = message.rawPayload();
            if (rawPayload == null) {
                throw new IllegalStateException("Mt101Message.rawPayload is required for SFTP send");
            }
            var bytes = rawPayload.getBytes(StandardCharsets.UTF_8);
            try (var input = new ByteArrayInputStream(bytes)) {
                channel.put(input, tmpPath, ChannelSftp.OVERWRITE);
            }
            // Atomic rename (the bank only ever sees the final path).
            channel.rename(tmpPath, dropPath);

            var durationMs = System.currentTimeMillis() - startedAt;
            // Gateway reference: para SFTP no hay respuesta; usamos el dropPath final.
            return TransportResult.accepted(dropPath, 1, durationMs);
        } catch (JSchException | SftpException | java.io.IOException error) {
            var durationMs = System.currentTimeMillis() - startedAt;
            return TransportResult.rejected(1, durationMs,
                    "SFTP " + error.getClass().getSimpleName() + ": " + error.getMessage());
        } finally {
            if (channel != null && channel.isConnected()) {
                channel.disconnect();
            }
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    private String resolveTemplate(String template, Mt101Message message) {
        var sendersReference = message.sequenceA() != null ? message.sequenceA().sendersReference() : "";
        var uetr = message.envelope() != null ? message.envelope().uetr() : "";
        return template
                .replace("${sendersReference}", sendersReference == null ? "" : sendersReference)
                .replace("${uetr}", uetr == null ? "" : uetr);
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
            throw new IllegalArgumentException("MT101_PAY transport=SFTP requires configuration." + fieldName);
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
