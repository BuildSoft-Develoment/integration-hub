package com.integrationhub.platform.provider.compress;

// @trace ADR-016 (compresion ZIP plano + AES-256 via zip4j, streaming)

import com.integrationhub.platform.spi.compress.CompressionEntry;
import com.integrationhub.platform.spi.compress.CompressionOptions;
import com.integrationhub.platform.spi.compress.FileCompressor;
import jakarta.enterprise.context.ApplicationScoped;
import net.lingala.zip4j.io.outputstream.ZipOutputStream;
import net.lingala.zip4j.model.ZipParameters;
import net.lingala.zip4j.model.enums.AesKeyStrength;
import net.lingala.zip4j.model.enums.CompressionLevel;
import net.lingala.zip4j.model.enums.EncryptionMethod;

import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;

/**
 * ADR-016: compresor ZIP via {@code zip4j} — ZIP plano y AES-256, config-driven por {@link CompressionOptions}. Soporta
 * multiples entradas (bundling) y streaming por entrada (nunca el archivo completo en heap). El password de cifrado
 * llega ya resuelto desde una referencia vault.
 */
@ApplicationScoped
public class ZipCompressor implements FileCompressor {

    @Override
    public String algorithm() {
        return "ZIP";
    }

    @Override
    public boolean supportsMultipleEntries() {
        return true;
    }

    @Override
    public boolean supportsEncryption() {
        return true;
    }

    @Override
    public long compress(List<CompressionEntry> entries, OutputStream target, CompressionOptions options) throws IOException {
        var password = options.encrypt() ? options.password() : null;
        // nonClosing: zos.close() finaliza el zip (directorio central) pero NO cierra el artefacto (su dueno lo cierra).
        try (var zos = new ZipOutputStream(nonClosing(target), password)) {
            for (var entry : entries) {
                var parameters = new ZipParameters();
                parameters.setFileNameInZip(entry.name());
                parameters.setCompressionLevel(zipLevel(options.deflateLevel()));
                if (options.encrypt()) {
                    parameters.setEncryptFiles(true);
                    parameters.setEncryptionMethod(EncryptionMethod.AES);
                    parameters.setAesKeyStrength(AesKeyStrength.KEY_STRENGTH_256);
                }
                zos.putNextEntry(parameters);
                try (var in = entry.source().open()) {
                    in.transferTo(zos);
                }
                zos.closeEntry();
            }
        }
        return entries.size();
    }

    private static CompressionLevel zipLevel(int deflateLevel) {
        if (deflateLevel <= 0) {
            return CompressionLevel.NO_COMPRESSION;
        }
        if (deflateLevel >= 7) {
            return CompressionLevel.MAXIMUM;
        }
        return CompressionLevel.NORMAL;
    }

    /** Filtro que hace flush pero NO cierra el delegate (el {@code WritableArtifact} es el dueno del stream). */
    private static OutputStream nonClosing(OutputStream delegate) {
        return new FilterOutputStream(delegate) {
            @Override
            public void write(byte[] bytes, int off, int len) throws IOException {
                out.write(bytes, off, len);
            }

            @Override
            public void close() throws IOException {
                flush();
            }
        };
    }
}
