package com.integrationhub.platform.spi.task.compress;

import java.io.IOException;
import java.io.InputStream;

/**
 * ADR-016: una entrada a comprimir. {@code name} es el nombre dentro del archivo comprimido; {@code source} abre el
 * stream de origen bajo demanda (una entrada a la vez, memoria acotada). El compresor cierra el stream tras copiarlo.
 */
public record CompressionEntry(String name, InputStreamSupplier source) {

    @FunctionalInterface
    public interface InputStreamSupplier {
        InputStream open() throws IOException;
    }
}
