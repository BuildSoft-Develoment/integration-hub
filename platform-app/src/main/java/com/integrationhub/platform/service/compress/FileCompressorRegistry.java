package com.integrationhub.platform.service.compress;

import com.integrationhub.platform.spi.compress.FileCompressor;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

import java.util.List;
import java.util.function.Supplier;
import java.util.stream.Stream;

/**
 * ADR-016: registry de {@link FileCompressor} (espejo de los otros). Resuelve por {@code algorithm} (case-insensitive)
 * sobre los beans CDI. Compresores como plugin remoto son fase posterior.
 */
@ApplicationScoped
public class FileCompressorRegistry {

    private final Supplier<Stream<FileCompressor>> compressors;

    @Inject
    public FileCompressorRegistry(Instance<FileCompressor> compressors) {
        this.compressors = () -> compressors == null ? Stream.empty() : compressors.stream();
    }

    /** Constructor de test: beans ya resueltos (sin CDI). */
    public FileCompressorRegistry(List<FileCompressor> compressors) {
        this.compressors = () -> compressors == null ? Stream.empty() : compressors.stream();
    }

    public FileCompressor resolve(String algorithm) {
        return compressors.get()
                .filter(compressor -> compressor.algorithm().equalsIgnoreCase(algorithm))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported compression algorithm: " + algorithm));
    }
}
