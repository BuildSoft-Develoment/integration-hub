package com.integrationhub.platform.provider.source;

import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.source.SourceProvider;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

@ApplicationScoped
public class FilesystemSourceProvider implements SourceProvider {

    @Override
    public String type() {
        return "FILESYSTEM";
    }

    @Override
    public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
        String configuredPath = SourceConfigurationSupport.requireString(configuration, "path");
        String resolvedPath = SourceConfigurationSupport.resolvePathTemplate(configuredPath, configuration);
        SourceConfigurationSupport.FileNameRule fileNameRule = SourceConfigurationSupport.fileNameRule(configuration);
        String selectionMode = SourceConfigurationSupport.selectionMode(configuration);
        String mediaType = SourceConfigurationSupport.optionalString(configuration, "mediaType", null);

        try {
            if (fileNameRule == null) {
                Path filePath = Path.of(resolvedPath);
                return List.of(toSelectedFile(filePath, mediaType));
            }
            return resolveFromDirectory(Path.of(resolvedPath), fileNameRule, selectionMode, mediaType);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot read file from filesystem: " + resolvedPath, e);
        }
    }

    @Override
    public SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration) {
        try {
            return SourcePayload.fromPath(Path.of(selectedFile.location()), selectedFile.mediaType());
        } catch (IOException e) {
            throw new IllegalStateException("Cannot open filesystem file: " + selectedFile.location(), e);
        }
    }

    private List<SelectedSourceFile> resolveFromDirectory(Path directory,
                                                          SourceConfigurationSupport.FileNameRule fileNameRule,
                                                          String selectionMode,
                                                          String mediaType) throws IOException {
        if (!Files.isDirectory(directory)) {
            throw new IllegalStateException("Filesystem source path must be a directory when a file selector is configured: " + directory);
        }

        try (Stream<Path> stream = Files.list(directory)) {
            List<Path> matches = stream
                    .filter(Files::isRegularFile)
                    .filter(path -> fileNameRule.matches(path.getFileName().toString()))
                    .sorted(Comparator.comparing(this::safeLastModified))
                    .toList();

            if (matches.isEmpty()) {
                throw new IllegalStateException("No files match selector " + fileNameRule.description() + " in " + directory);
            }
            if ("single".equalsIgnoreCase(selectionMode)) {
                if (matches.size() != 1) {
                    throw new IllegalStateException("Expected exactly one file for selector " + fileNameRule.description() + " in " + directory + " but found " + matches.size());
                }
                return List.of(toSelectedFile(matches.getFirst(), mediaType));
            }
            if ("all".equalsIgnoreCase(selectionMode)) {
                return matches.stream().map(path -> toSelectedFile(path, mediaType)).toList();
            }
            return List.of(toSelectedFile(matches.getLast(), mediaType));
        }
    }

    private SelectedSourceFile toSelectedFile(Path filePath, String configuredMediaType) {
        try {
            var fileName = filePath.getFileName().toString();
            var mediaType = SourceConfigurationSupport.detectMediaType(fileName, configuredMediaType);
            var size = Files.exists(filePath) ? Files.size(filePath) : null;
            var lastModified = Files.exists(filePath) ? Files.getLastModifiedTime(filePath).toInstant() : null;
            return new SelectedSourceFile(fileName, filePath.toString(), mediaType, size, lastModified);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot inspect filesystem file: " + filePath, e);
        }
    }

    private FileTime safeLastModified(Path path) {
        try {
            return Files.getLastModifiedTime(path);
        } catch (IOException e) {
            return FileTime.fromMillis(0);
        }
    }
}
