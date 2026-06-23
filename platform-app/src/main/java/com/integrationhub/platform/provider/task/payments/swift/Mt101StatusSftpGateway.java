package com.integrationhub.platform.provider.task.payments.swift;

import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpException;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;

/**
 * StatusTransport SFTP para {@code MT101_STATUS}: para bancos H2H por SFTP, el estado de un pago no se
 * consulta por HTTP sino leyendo el ARCHIVO DE RESPUESTA (ACK/NACK / MT199 / pacs.002) que el banco deja
 * en un directorio de confirmaciones. Este gateway descarga el contenido de ese archivo por
 * {@code senders_reference}/{@code uetr}; el provider extrae el estado (tokens ACK/NACK o JSON-path).
 *
 * <p>Semantica de STATUS (no de envio): si el archivo de respuesta AUN no existe, NO es un error: el
 * banco todavia no respondio y el fragmento queda pendiente (se reintenta). Solo un fallo real de
 * conexion/SFTP es error.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-005 (STATUS por SFTP)
 */
public final class Mt101StatusSftpGateway {

    private static final int DEFAULT_TIMEOUT_MILLIS = 15000;
    private static final int DEFAULT_PORT = 22;

    /** Respuesta: {@code body} con el contenido del archivo, o {@code null} si aun no existe (pendiente). */
    public record SftpStatusResponse(String body, boolean found, String error) {
    }

    /**
     * Lee el archivo de respuesta del banco en {@code responseFilePath}. Devuelve found=false (sin error)
     * si el archivo no existe todavia; error != null solo ante fallo real de conexion/SFTP.
     */
    public SftpStatusResponse fetchResponse(Map<String, Object> sftpConfig, String responseFilePath) {
        if (sftpConfig == null || sftpConfig.isEmpty()) {
            return new SftpStatusResponse(null, false, "MT101_STATUS SFTP requires sftp config for the route");
        }
        var host = stringRequired(sftpConfig.get("host"), "sftp.host");
        var port = intValue(sftpConfig.get("port"), DEFAULT_PORT);
        var username = stringRequired(sftpConfig.get("username"), "sftp.username");
        var password = stringOrNull(sftpConfig.get("password"));
        var privateKeyPath = stringOrNull(sftpConfig.get("privateKeyPath"));
        var passphrase = stringOrNull(sftpConfig.get("passphrase"));
        var timeoutMillis = intValue(sftpConfig.get("timeoutMillis"), DEFAULT_TIMEOUT_MILLIS);
        var strictHostKeyChecking = boolValue(sftpConfig.get("strictHostKeyChecking"), true);
        var knownHostsPath = stringOrNull(sftpConfig.get("knownHostsPath"));

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

            if (!remoteFileExists(channel, responseFilePath)) {
                // El banco aun no dejo el archivo de respuesta: pendiente, no error.
                return new SftpStatusResponse(null, false, null);
            }
            try (var out = new ByteArrayOutputStream();
                 var in = channel.get(responseFilePath)) {
                in.transferTo(out);
                return new SftpStatusResponse(out.toString(StandardCharsets.UTF_8), true, null);
            }
        } catch (JSchException | SftpException | java.io.IOException error) {
            return new SftpStatusResponse(null, false,
                    "SFTP STATUS " + error.getClass().getSimpleName() + ": " + error.getMessage());
        } finally {
            if (channel != null && channel.isConnected()) {
                channel.disconnect();
            }
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * v27 P1: distingue "el archivo aun no existe" (pendiente legitimo) de un error real (permiso, ruta
     * invalida, servidor): solo {@code SSH_FX_NO_SUCH_FILE} es pendiente; cualquier otro SftpException se
     * propaga como error (no se oculta como "ACK pendiente").
     */
    private boolean remoteFileExists(ChannelSftp channel, String path) throws SftpException {
        try {
            channel.stat(path);
            return true;
        } catch (SftpException error) {
            if (error.id == ChannelSftp.SSH_FX_NO_SUCH_FILE) {
                return false;
            }
            throw error;
        }
    }

    /** Clasifica el contenido del archivo de respuesta como ACCEPTED/REJECTED/null por tokens del banco. */
    public String classifyByTokens(String body, java.util.List<String> acceptedTokens,
                                   java.util.List<String> rejectedTokens) {
        if (body == null || body.isBlank()) {
            return null;
        }
        var upper = body.toUpperCase(Locale.ROOT);
        for (var token : rejectedTokens) {
            if (token != null && !token.isBlank() && upper.contains(token.toUpperCase(Locale.ROOT))) {
                return "REJECTED";
            }
        }
        for (var token : acceptedTokens) {
            if (token != null && !token.isBlank() && upper.contains(token.toUpperCase(Locale.ROOT))) {
                return "ACCEPTED";
            }
        }
        return null;
    }

    private String stringOrNull(Object raw) {
        if (raw == null) {
            return null;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? null : value;
    }

    private String stringRequired(Object raw, String field) {
        var value = stringOrNull(raw);
        if (value == null) {
            throw new IllegalArgumentException("MT101_STATUS SFTP requires routeQuery.sftp." + field);
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
