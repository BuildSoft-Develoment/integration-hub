package com.integrationhub.platform.provider.task.sink;

// @trace ADR-016 (sink de salida SFTP: upload STREAMING desde el artefacto + temporal/rename; sin byte[] como el pago)

import com.integrationhub.platform.spi.task.sink.OutputSink;
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
    private static final String LABEL = "SFTP";

    @Override
    public String type() {
        return "SFTP";
    }

    @Override
    public void deliver(String dropPath, StreamSource source, Map<String, Object> configuration) throws IOException {
        var host = SinkConfigurationSupport.requireString(configuration, "host", LABEL);
        var port = SinkConfigurationSupport.optionalInt(configuration, "port", 22);
        var username = SinkConfigurationSupport.requireString(configuration, "username", LABEL);
        var password = SinkConfigurationSupport.optionalString(configuration, "password");
        var privateKeyPath = SinkConfigurationSupport.optionalString(configuration, "privateKeyPath");
        var passphrase = SinkConfigurationSupport.optionalString(configuration, "passphrase");
        var timeoutMillis = SinkConfigurationSupport.optionalInt(configuration, "timeoutMillis", 15000);
        var strictHostKeyChecking = SinkConfigurationSupport.optionalBoolean(configuration, "strictHostKeyChecking", true);
        var knownHostsPath = SinkConfigurationSupport.optionalString(configuration, "knownHostsPath");
        var tmpExtension = SinkConfigurationSupport.optionalString(configuration, "tmpExtension");
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
            renameOverwriting(channel, tmpPath, dropPath);
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

    /**
     * Pone el temporal en su nombre final, pisando el destino solo si estorba.
     *
     * <p>Se intenta el {@code rename} PRIMERO. Antes se hacia al reves —borrar el destino y luego
     * renombrar—, que es lo intuitivo y es peor: si el rename falla despues del borrado, se ha
     * destruido la entrega anterior sin llegar a poner la nueva, y el directorio del banco se queda sin
     * ninguna de las dos. Hacen falta dos casualidades a la vez (que el nombre ya exista Y que el
     * rename falle), asi que el riesgo real es bajo; el arreglo es barato, asi que no hay motivo para
     * convivir con el.</p>
     *
     * <p>El borrado sigue estando porque {@code SSH_FXP_RENAME} suele fallar con el destino ocupado:
     * es la re-entrega del mismo archivo —un reintento tras un fallo de red, o el reproceso de un
     * envio— la que tiene que poder pisar lo anterior.</p>
     */
    // Visible para el test: el ORDEN de estas tres operaciones es lo que hay que fijar, y no se puede
    // ejercer desde deliver() sin un servidor porque la sesion se abre ahi dentro.
    static void renameOverwriting(ChannelSftp channel, String tmpPath, String dropPath) throws SftpException {
        try {
            channel.rename(tmpPath, dropPath);
        } catch (SftpException maybeInTheWay) {
            if (!exists(channel, dropPath)) {
                // El rename no fallo por colision (permisos, ruta inexistente...). Borrar aqui seria
                // volver a abrir el agujero por otra puerta: se propaga el fallo sin tocar nada.
                throw maybeInTheWay;
            }
            channel.rm(dropPath);
            channel.rename(tmpPath, dropPath);
        }
    }

    private static boolean exists(ChannelSftp channel, String path) {
        try {
            channel.stat(path);
            return true;
        } catch (SftpException notThere) {
            return false;
        }
    }

}
