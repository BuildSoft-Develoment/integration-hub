package com.integrationhub.platform.provider.source;

import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.source.SourceProvider;
import jakarta.enterprise.context.ApplicationScoped;
import org.apache.commons.net.ftp.FTP;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPFile;

import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class FtpSourceProvider implements SourceProvider {

    @Override
    public String type() {
        return "FTP";
    }

    @Override
    public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
        String host = SourceConfigurationSupport.requireString(configuration, "host");
        int port = SourceConfigurationSupport.optionalInt(configuration, "port", 21);
        String username = SourceConfigurationSupport.requireString(configuration, "username");
        String password = SourceConfigurationSupport.requireString(configuration, "password");
        String resolvedRemotePath = SourceConfigurationSupport.resolvePathTemplate(SourceConfigurationSupport.requireString(configuration, "remotePath"), configuration);
        SourceConfigurationSupport.FileNameRule fileNameRule = SourceConfigurationSupport.fileNameRule(configuration);
        String selectionMode = SourceConfigurationSupport.selectionMode(configuration);
        boolean passiveMode = SourceConfigurationSupport.optionalBoolean(configuration, "passiveMode", true);
        int timeoutMillis = SourceConfigurationSupport.optionalInt(configuration, "timeoutMillis", 15000);
        String mediaType = SourceConfigurationSupport.optionalString(configuration, "mediaType", null);

        FTPClient ftpClient = new FTPClient();
        ftpClient.setConnectTimeout(timeoutMillis);
        ftpClient.setDefaultTimeout(timeoutMillis);
        ftpClient.setDataTimeout(timeoutMillis);
        try {
            ftpClient.connect(host, port);
            if (!ftpClient.login(username, password)) {
                throw new IllegalStateException("FTP authentication failed for user " + username);
            }
            if (passiveMode) {
                ftpClient.enterLocalPassiveMode();
            }
            ftpClient.setFileType(FTP.BINARY_FILE_TYPE);

            if (fileNameRule == null) {
                String fileName = resolvedRemotePath.contains("/") ? resolvedRemotePath.substring(resolvedRemotePath.lastIndexOf('/') + 1) : resolvedRemotePath;
                return List.of(new SelectedSourceFile(fileName, resolvedRemotePath, SourceConfigurationSupport.detectMediaType(fileName, mediaType), null, null));
            }
            return selectRemoteFiles(ftpClient, resolvedRemotePath, fileNameRule, selectionMode, mediaType);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot inspect FTP source", e);
        } finally {
            if (ftpClient.isConnected()) {
                try {
                    ftpClient.logout();
                    ftpClient.disconnect();
                } catch (IOException ignored) {
                }
            }
        }
    }

    @Override
    public SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration) {
        String host = SourceConfigurationSupport.requireString(configuration, "host");
        int port = SourceConfigurationSupport.optionalInt(configuration, "port", 21);
        String username = SourceConfigurationSupport.requireString(configuration, "username");
        String password = SourceConfigurationSupport.requireString(configuration, "password");
        boolean passiveMode = SourceConfigurationSupport.optionalBoolean(configuration, "passiveMode", true);
        int timeoutMillis = SourceConfigurationSupport.optionalInt(configuration, "timeoutMillis", 15000);

        FTPClient ftpClient = new FTPClient();
        ftpClient.setConnectTimeout(timeoutMillis);
        ftpClient.setDefaultTimeout(timeoutMillis);
        ftpClient.setDataTimeout(timeoutMillis);
        try {
            ftpClient.connect(host, port);
            if (!ftpClient.login(username, password)) {
                throw new IllegalStateException("FTP authentication failed for user " + username);
            }
            if (passiveMode) {
                ftpClient.enterLocalPassiveMode();
            }
            ftpClient.setFileType(FTP.BINARY_FILE_TYPE);

            // Streaming a archivo temporal (no byte[]) para no presionar el heap
            // con archivos grandes; el reader lo lee por lotes desde disco.
            return TempFileSourcePayload.fromDownloadedTemp(selectedFile.name(), selectedFile.location(), tempFile -> {
                try (var fileOut = java.nio.file.Files.newOutputStream(tempFile)) {
                    boolean retrieved = ftpClient.retrieveFile(selectedFile.location(), fileOut);
                    if (!retrieved) {
                        throw new IOException("Cannot retrieve FTP file: " + selectedFile.location());
                    }
                }
                return selectedFile.mediaType();
            });
        } catch (IOException e) {
            throw new IllegalStateException("Cannot read file from FTP source", e);
        } finally {
            if (ftpClient.isConnected()) {
                try {
                    ftpClient.logout();
                    ftpClient.disconnect();
                } catch (IOException ignored) {
                }
            }
        }
    }

    private List<SelectedSourceFile> selectRemoteFiles(FTPClient ftpClient,
                                                       String directory,
                                                       SourceConfigurationSupport.FileNameRule fileNameRule,
                                                       String selectionMode,
                                                       String configuredMediaType) throws IOException {
        FTPFile[] remoteFiles = ftpClient.listFiles(directory);
        List<FTPFile> matches = Arrays.stream(remoteFiles)
                .filter(FTPFile::isFile)
                .filter(file -> fileNameRule.matches(file.getName()))
                .sorted(Comparator.comparing(this::ftpInstant))
                .toList();

        if (matches.isEmpty()) {
            throw new IllegalStateException("No FTP files match selector " + fileNameRule.description() + " in " + directory);
        }
        if ("single".equalsIgnoreCase(selectionMode)) {
            if (matches.size() != 1) {
                throw new IllegalStateException("Expected exactly one FTP file for selector " + fileNameRule.description() + " in " + directory + " but found " + matches.size());
            }
            return List.of(toSelectedFile(directory, matches.getFirst(), configuredMediaType));
        }
        if ("all".equalsIgnoreCase(selectionMode)) {
            return matches.stream().map(file -> toSelectedFile(directory, file, configuredMediaType)).toList();
        }
        return List.of(toSelectedFile(directory, matches.getLast(), configuredMediaType));
    }

    private SelectedSourceFile toSelectedFile(String directory, FTPFile file, String configuredMediaType) {
        return new SelectedSourceFile(
                file.getName(),
                SourceConfigurationSupport.joinRemotePath(directory, file.getName()),
                SourceConfigurationSupport.detectMediaType(file.getName(), configuredMediaType),
                file.getSize() <= 0 ? null : file.getSize(),
                ftpInstant(file)
        );
    }

    private Instant ftpInstant(FTPFile file) {
        return file.getTimestamp() == null ? Instant.EPOCH : file.getTimestamp().toInstant();
    }
}
