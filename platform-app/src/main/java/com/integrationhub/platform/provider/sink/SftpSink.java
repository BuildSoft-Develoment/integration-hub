package com.integrationhub.platform.provider.sink;

// @trace ADR-016 (sink de salida SFTP: upload STREAMING desde el artefacto + temporal/rename; sin byte[] como el pago)

import com.integrationhub.platform.spi.sink.OutputSink;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpException;
import io.quarkus.arc.properties.UnlessBuildProperty;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;
import java.util.Map;
import java.util.Properties;

/**
 * ADR-016: sink SFTP. Sube el artefacto por SFTP <b>streaming</b> ({@code channel.put(InputStream, ...)}), a diferencia
 * del {@code SftpPaymentTransport} de pagos que carga el payload en un {@code byte[]} (ok para fragmentos MT101 de ~8KB,
 * OOM para un CSV/Excel pesado). Sube a un temporal ({@code dropPath + tmpExtension}) y hace {@code rename} al nombre
 * final (visibilidad atomica). Reutiliza la config de conexion de una definicion {@code /sources} tipo SFTP.
 */
@ApplicationScoped
@UnlessBuildProperty(name = "integrationhub.native.disable.sftp", stringValue = "true", enableIfMissing = true)
public class SftpSink implements OutputSink {

    private static final String DEFAULT_TMP_EXTENSION = ".part";

    @Override
    public String type() {
        return "SFTP";
    }

    @Override
    public void deliver(String dropPath, StreamSource source, Map<String, Object> configuration) throws IOException {
        var host = requireString(configuration, "host");
        var port = optionalInt(configuration, "port", 22);
        var username = requireString(configuration, "username");
        var password = optionalString(configuration, "password");
        var privateKeyPath = optionalString(configuration, "privateKeyPath");
        var passphrase = optionalString(configuration, "passphrase");
        var timeoutMillis = optionalInt(configuration, "timeoutMillis", 15000);
        var strictHostKeyChecking = optionalBoolean(configuration, "strictHostKeyChecking", true);
        var knownHostsPath = optionalString(configuration, "knownHostsPath");
        var tmpExtension = optionalString(configuration, "tmpExtension");
        var tmpPath = dropPath + (tmpExtension == null ? DEFAULT_TMP_EXTENSION : tmpExtension);

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

            try (var in = source.open()) {
                channel.put(in, tmpPath, ChannelSftp.OVERWRITE);
            }
            // rename SSH_FXP_RENAME suele fallar si el destino existe -> se elimina primero (best-effort).
            removeIfExists(channel, dropPath);
            channel.rename(tmpPath, dropPath);
        } catch (JSchException | SftpException error) {
            throw new IOException("SFTP sink could not deliver to " + dropPath + " on " + host, error);
        } finally {
            if (channel != null && channel.isConnected()) {
                channel.disconnect();
            }
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    private static void removeIfExists(ChannelSftp channel, String path) {
        try {
            channel.rm(path);
        } catch (SftpException notThere) {
            // no existia: nada que borrar
        }
    }

    private static String requireString(Map<String, Object> configuration, String key) {
        var value = optionalString(configuration, key);
        if (value == null) {
            throw new IllegalArgumentException("SFTP sink requires '" + key + "'");
        }
        return value;
    }

    private static String optionalString(Map<String, Object> configuration, String key) {
        var raw = configuration.get(key);
        if (raw == null) {
            return null;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? null : value;
    }

    private static int optionalInt(Map<String, Object> configuration, String key, int defaultValue) {
        var value = optionalString(configuration, key);
        return value == null ? defaultValue : Integer.parseInt(value);
    }

    private static boolean optionalBoolean(Map<String, Object> configuration, String key, boolean defaultValue) {
        var value = optionalString(configuration, key);
        return value == null ? defaultValue : Boolean.parseBoolean(value);
    }
}
