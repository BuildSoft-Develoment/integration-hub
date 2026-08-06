package com.integrationhub.platform.provider.source;

import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.source.SourceProvider;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpATTRS;
import com.jcraft.jsch.SftpException;
import io.quarkus.arc.properties.UnlessBuildProperty;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Properties;

@ApplicationScoped
@UnlessBuildProperty(name = "integrationhub.native.disable.sftp", stringValue = "true", enableIfMissing = true)
public class SftpSourceProvider implements SourceProvider {

    @Override
    public String type() {
        return "SFTP";
    }

    /**
     * QA-006: campos que solo pueden persistirse como referencia ${secret:...}.
     * <p>privateKeyPath NO va: es la RUTA a la clave, no la clave.</p>
     */
    @Override
    public List<String> credentialKeys() {
        return List.of("password", "passphrase");
    }

    @Override
    public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
        String host = SourceConfigurationSupport.requireString(configuration, "host");
        int port = SourceConfigurationSupport.optionalInt(configuration, "port", 22);
        String username = SourceConfigurationSupport.requireString(configuration, "username");
        String resolvedRemotePath = SourceConfigurationSupport.resolvePathTemplate(SourceConfigurationSupport.requireString(configuration, "remotePath"), configuration);
        SourceConfigurationSupport.FileNameRule fileNameRule = SourceConfigurationSupport.fileNameRule(configuration);
        String selectionMode = SourceConfigurationSupport.selectionMode(configuration);
        String password = SourceConfigurationSupport.optionalString(configuration, "password", null);
        String privateKeyPath = SourceConfigurationSupport.optionalString(configuration, "privateKeyPath", null);
        String passphrase = SourceConfigurationSupport.optionalString(configuration, "passphrase", null);
        int timeoutMillis = SourceConfigurationSupport.optionalInt(configuration, "timeoutMillis", 15000);
        boolean strictHostKeyChecking = SourceConfigurationSupport.optionalBoolean(configuration, "strictHostKeyChecking", true);
        String knownHostsPath = SourceConfigurationSupport.optionalString(configuration, "knownHostsPath", null);
        String mediaType = SourceConfigurationSupport.optionalString(configuration, "mediaType", null);

        Session session = null;
        ChannelSftp channel = null;
        try {
            JSch jsch = createJsch(privateKeyPath, passphrase, knownHostsPath);

            session = jsch.getSession(username, host, port);
            if (password != null) {
                session.setPassword(password);
            }

            Properties properties = new Properties();
            properties.put("StrictHostKeyChecking", strictHostKeyChecking ? "yes" : "no");
            session.setConfig(properties);
            session.connect(timeoutMillis);

            channel = (ChannelSftp) session.openChannel("sftp");
            channel.connect(timeoutMillis);

            if (fileNameRule == null) {
                // 015: verificar que la ruta remota EXISTE. Antes "Probar" solo validaba la conexion
                // (usuario/clave) y aceptaba cualquier remotePath; stat() falla fail-loud si no existe.
                try {
                    channel.stat(resolvedRemotePath);
                } catch (SftpException notFound) {
                    throw new IllegalStateException("Remote path not found on SFTP server: " + resolvedRemotePath, notFound);
                }
                String fileName = Path.of(resolvedRemotePath).getFileName().toString();
                return List.of(new SelectedSourceFile(fileName, resolvedRemotePath, SourceConfigurationSupport.detectMediaType(fileName, mediaType), null, null));
            }
            return selectRemoteFiles(channel, resolvedRemotePath, fileNameRule, selectionMode, mediaType);
        } catch (JSchException | SftpException e) {
            throw new IllegalStateException("Cannot inspect SFTP source", e);
        } finally {
            if (channel != null && channel.isConnected()) {
                channel.disconnect();
            }
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    @Override
    public SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration) {
        String host = SourceConfigurationSupport.requireString(configuration, "host");
        int port = SourceConfigurationSupport.optionalInt(configuration, "port", 22);
        String username = SourceConfigurationSupport.requireString(configuration, "username");
        String password = SourceConfigurationSupport.optionalString(configuration, "password", null);
        String privateKeyPath = SourceConfigurationSupport.optionalString(configuration, "privateKeyPath", null);
        String passphrase = SourceConfigurationSupport.optionalString(configuration, "passphrase", null);
        int timeoutMillis = SourceConfigurationSupport.optionalInt(configuration, "timeoutMillis", 15000);
        boolean strictHostKeyChecking = SourceConfigurationSupport.optionalBoolean(configuration, "strictHostKeyChecking", true);
        String knownHostsPath = SourceConfigurationSupport.optionalString(configuration, "knownHostsPath", null);

        Session session = null;
        ChannelSftp channel = null;
        try {
            JSch jsch = createJsch(privateKeyPath, passphrase, knownHostsPath);

            session = jsch.getSession(username, host, port);
            if (password != null) {
                session.setPassword(password);
            }

            Properties properties = new Properties();
            properties.put("StrictHostKeyChecking", strictHostKeyChecking ? "yes" : "no");
            session.setConfig(properties);
            session.connect(timeoutMillis);

            channel = (ChannelSftp) session.openChannel("sftp");
            channel.connect(timeoutMillis);

            // Streaming a archivo temporal (no byte[]): un CSV de varios GB por
            // SFTP no presiona el heap; el reader lo lee por lotes desde disco.
            ChannelSftp downloadChannel = channel;
            return TempFileSourcePayload.fromDownloadedTemp(selectedFile.name(), selectedFile.location(), tempFile -> {
                try (var fileOut = java.nio.file.Files.newOutputStream(tempFile)) {
                    downloadChannel.get(selectedFile.location(), fileOut);
                }
                return selectedFile.mediaType();
            });
        } catch (JSchException | IOException e) {
            throw new IllegalStateException("Cannot read file from SFTP source", e);
        } finally {
            if (channel != null && channel.isConnected()) {
                channel.disconnect();
            }
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    private JSch createJsch(String privateKeyPath, String passphrase, String knownHostsPath) throws JSchException {
        JSch jsch = new JSch();
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
        return jsch;
    }

    @SuppressWarnings("unchecked")
    private List<SelectedSourceFile> selectRemoteFiles(ChannelSftp channel,
                                                       String directory,
                                                       SourceConfigurationSupport.FileNameRule fileNameRule,
                                                       String selectionMode,
                                                       String configuredMediaType) throws SftpException {
        List<ChannelSftp.LsEntry> matches = ((List<ChannelSftp.LsEntry>) channel.ls(directory)).stream()
                .filter(entry -> !entry.getAttrs().isDir())
                .filter(entry -> fileNameRule.matches(entry.getFilename()))
                .sorted(Comparator.comparing(entry -> sftpModifiedTime(entry.getAttrs())))
                .toList();

        if (matches.isEmpty()) {
            throw new IllegalStateException("No SFTP files match selector " + fileNameRule.description() + " in " + directory);
        }
        if ("single".equalsIgnoreCase(selectionMode)) {
            if (matches.size() != 1) {
                throw new IllegalStateException("Expected exactly one SFTP file for selector " + fileNameRule.description() + " in " + directory + " but found " + matches.size());
            }
            return List.of(toSelectedFile(directory, matches.getFirst(), configuredMediaType));
        }
        if ("all".equalsIgnoreCase(selectionMode)) {
            return matches.stream().map(entry -> toSelectedFile(directory, entry, configuredMediaType)).toList();
        }
        return List.of(toSelectedFile(directory, matches.getLast(), configuredMediaType));
    }

    private SelectedSourceFile toSelectedFile(String directory, ChannelSftp.LsEntry entry, String configuredMediaType) {
        var attrs = entry.getAttrs();
        return new SelectedSourceFile(
                entry.getFilename(),
                SourceConfigurationSupport.joinRemotePath(directory, entry.getFilename()),
                SourceConfigurationSupport.detectMediaType(entry.getFilename(), configuredMediaType),
                attrs == null || attrs.getSize() <= 0 ? null : attrs.getSize(),
                attrs == null ? Instant.EPOCH : Instant.ofEpochSecond(attrs.getMTime())
        );
    }

    private long sftpModifiedTime(SftpATTRS attrs) {
        return attrs == null ? 0L : attrs.getMTime();
    }
}
