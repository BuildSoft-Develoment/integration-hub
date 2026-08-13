package com.integrationhub.platform.provider.task.sink;

// @trace ADR-016 RF-011 (sink de salida FTP: upload STREAMING + temporal/rename, espejo de FtpSourceProvider)

import com.integrationhub.platform.spi.task.sink.OutputSink;
import jakarta.enterprise.context.ApplicationScoped;
import org.apache.commons.net.ftp.FTP;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPReply;

import java.io.IOException;
import java.util.Map;

/**
 * ADR-016 / RF-011: sink FTP, espejo de salida de {@code FtpSourceProvider}.
 *
 * <p>Sube por <b>streaming</b> ({@code storeFile(path, InputStream)}: commons-net consume el stream y no
 * materializa el archivo) a un temporal {@code dropPath + tmpExtension} y hace {@code rename} al nombre
 * final. FTP sí tiene rename (RNFR/RNTO), asi que aqui la garantia de visibilidad atomica es la misma que
 * en SFTP — y hace mas falta que en ningun otro sitio: en un FTP el consumidor tipico es un cron ajeno que
 * recoge todo lo que encuentra en el directorio, y un archivo a medio subir se lo lleva igual.</p>
 *
 * <p>Modo BINARIO siempre. El default de FTP es ASCII, que reescribe los saltos de linea segun la
 * plataforma del servidor: un TXT de ancho fijo entregado en ASCII llega con los bytes cambiados y
 * cuadrando mal, sin que nada falle.</p>
 */
@ApplicationScoped
public class FtpSink implements OutputSink {

    private static final String DEFAULT_TMP_EXTENSION = ".part";
    private static final String LABEL = "FTP";

    @Override
    public String type() {
        return "FTP";
    }

    @Override
    public void deliver(String dropPath, StreamSource source, Map<String, Object> configuration) throws IOException {
        var host = SinkConfigurationSupport.requireString(configuration, "host", LABEL);
        var port = SinkConfigurationSupport.optionalInt(configuration, "port", 21);
        var username = SinkConfigurationSupport.requireString(configuration, "username", LABEL);
        var password = SinkConfigurationSupport.requireString(configuration, "password", LABEL);
        var passiveMode = SinkConfigurationSupport.optionalBoolean(configuration, "passiveMode", true);
        var timeoutMillis = SinkConfigurationSupport.optionalInt(configuration, "timeoutMillis", 15000);
        var tmpExtension = SinkConfigurationSupport.optionalString(configuration, "tmpExtension", DEFAULT_TMP_EXTENSION);
        var tmpPath = dropPath + tmpExtension;

        var client = new FTPClient();
        client.setConnectTimeout(timeoutMillis);
        client.setDefaultTimeout(timeoutMillis);
        client.setDataTimeout(timeoutMillis);
        try {
            client.connect(host, port);
            if (!FTPReply.isPositiveCompletion(client.getReplyCode())) {
                throw new IOException("FTP sink was refused by " + host + ":" + port + " (" + client.getReplyString().trim() + ")");
            }
            if (!client.login(username, password)) {
                throw new IOException("FTP sink authentication failed for user " + username + " on " + host);
            }
            if (passiveMode) {
                client.enterLocalPassiveMode();
            }
            client.setFileType(FTP.BINARY_FILE_TYPE);

            try (var in = source.open()) {
                if (!client.storeFile(tmpPath, in)) {
                    var reply = client.getReplyString().trim();
                    // Se limpia el parcial por lo mismo que en el fallo del rename: un temporal a medias
                    // no lo recoge nadie (lleva otra extension), pero se queda ocupando cuota en el FTP
                    // del banco hasta que alguien lo mire.
                    client.deleteFile(tmpPath);
                    throw new IOException("FTP sink could not write " + tmpPath + " on " + host
                            + " (" + reply + ")");
                }
            }
            // Se intenta el rename PRIMERO y solo se borra el destino si estorba. Al reves —borrar y
            // luego renombrar— es lo intuitivo y es peor: si el rename falla despues del borrado, se ha
            // destruido la entrega anterior sin llegar a poner la nueva, y el directorio del banco se
            // queda sin ninguna de las dos. Muchos servidores rechazan RNTO con el destino ocupado, de
            // ahi el segundo intento.
            if (!client.rename(tmpPath, dropPath) && !(client.deleteFile(dropPath) && client.rename(tmpPath, dropPath))) {
                var reply = client.getReplyString().trim();
                // El temporal quedaria a la vista con nombre raro; se limpia para no dejar basura que
                // el proximo intento confunda con una entrega buena.
                client.deleteFile(tmpPath);
                throw new IOException("FTP sink uploaded " + tmpPath + " but could not rename it to "
                        + dropPath + " on " + host + " (" + reply + ")");
            }
        } finally {
            if (client.isConnected()) {
                try {
                    client.logout();
                } catch (IOException ignored) {
                    // el logout no cambia lo ya entregado
                }
                try {
                    client.disconnect();
                } catch (IOException ignored) {
                    // idem
                }
            }
        }
    }
}
