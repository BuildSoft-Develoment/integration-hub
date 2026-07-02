package com.integrationhub.platform.service.source;

import com.integrationhub.platform.spi.source.SourcePayload;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;
import java.io.InputStream;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Objects;

/**
 * Calcula la huella estable (SHA-256) de un archivo origen (csv/txt/excel/fin/...)
 * para identificar exactamente que archivo produjo cada registro en la trazabilidad
 * E2E. Es el unico responsable del hash (SRP): los providers solo lo consumen.
 *
 * <p>El hash se computa por streaming (no carga el archivo en memoria), de modo
 * que sirve igual para un CSV de 1M filas que para un .fin pequeno. El llamador
 * debe cachear el resultado por fuente (p.ej. en el {@code TaskContext}) para no
 * releer el archivo en cada batch.</p>
 */
@ApplicationScoped
public class SourceFingerprintService {

    /**
     * SHA-256 hex del contenido del archivo. Sin fallback: si el archivo no se puede
     * leer o digerir, lanza en vez de devolver {@code null}; la identidad del archivo
     * es parte de la trazabilidad requerida, no un enriquecimiento opcional.
     */
    public String fileHash(SourcePayload sourcePayload) {
        Objects.requireNonNull(sourcePayload, "sourcePayload");
        try (InputStream stream = sourcePayload.openStream()) {
            var digest = MessageDigest.getInstance("SHA-256");
            try (var digestStream = new DigestInputStream(stream, digest)) {
                var buffer = new byte[8192];
                while (digestStream.read(buffer) != -1) {
                    // DigestInputStream actualiza el digest al leer.
                }
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (IOException | NoSuchAlgorithmException error) {
            throw new IllegalStateException("Cannot compute SHA-256 of source file "
                    + sourcePayload.name(), error);
        }
    }
}
