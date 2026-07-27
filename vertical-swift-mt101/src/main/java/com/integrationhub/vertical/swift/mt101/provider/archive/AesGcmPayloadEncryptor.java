package com.integrationhub.vertical.swift.mt101.provider.archive;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Cifrador AES-GCM 256 bits del {@code raw_payload}.
 *
 * <p><b>Formato del ciphertext de salida</b>: {@code "AES-GCM-256:" + base64(iv || tag || ciphertext)}.
 * El IV es de 12 bytes (recomendado por NIST para GCM). El tag de autenticacion es
 * de 128 bits (16 bytes), concatenado por la implementacion JDK al final del cipher.</p>
 *
 * <p>La clave se deriva del texto suministrado por el caller via SHA-256 (siempre 256
 * bits independientemente del largo del input). Esto facilita aceptar claves provistas
 * como {@code ${secret:archive_key}} sin imponer formato hex/base64.</p>
 *
 * <p>Esta implementacion es <b>no-CDI</b>: se instancia con la clave concreta. El
 * {@code Mt101ArchiveTaskProvider} la crea bajo demanda usando la clave resuelta
 * del secreto.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-014, RF-021, T-020
 * @trace ADR-009
 */
public final class AesGcmPayloadEncryptor implements PayloadEncryptor {

    public static final String ALGORITHM_ID = "AES-GCM-256";
    private static final String CIPHER_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int AUTH_TAG_LENGTH_BITS = 128;
    private static final String PREFIX = ALGORITHM_ID + ":";

    private final byte[] keyBytes;
    private final SecureRandom secureRandom = new SecureRandom();

    public AesGcmPayloadEncryptor(String key) {
        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("AesGcmPayloadEncryptor requires a non-blank key");
        }
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            this.keyBytes = digest.digest(key.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException error) {
            throw new IllegalStateException("Cannot derive AES key", error);
        }
    }

    @Override
    public String algorithm() {
        return ALGORITHM_ID;
    }

    @Override
    public String encrypt(String plaintext) {
        if (plaintext == null) {
            throw new IllegalArgumentException("plaintext cannot be null");
        }
        try {
            var iv = new byte[IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);
            var cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(keyBytes, "AES"),
                    new GCMParameterSpec(AUTH_TAG_LENGTH_BITS, iv));
            var ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            var combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);
            return PREFIX + Base64.getEncoder().encodeToString(combined);
        } catch (GeneralSecurityException error) {
            throw new IllegalStateException("Encryption failed", error);
        }
    }

    @Override
    public String decrypt(String ciphertext) {
        if (ciphertext == null || !ciphertext.startsWith(PREFIX)) {
            throw new IllegalArgumentException(
                    "ciphertext does not match " + ALGORITHM_ID + " format");
        }
        try {
            var blob = Base64.getDecoder().decode(ciphertext.substring(PREFIX.length()));
            if (blob.length <= IV_LENGTH_BYTES) {
                throw new IllegalArgumentException("ciphertext too short");
            }
            var iv = new byte[IV_LENGTH_BYTES];
            var encrypted = new byte[blob.length - IV_LENGTH_BYTES];
            System.arraycopy(blob, 0, iv, 0, IV_LENGTH_BYTES);
            System.arraycopy(blob, IV_LENGTH_BYTES, encrypted, 0, encrypted.length);
            var cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(keyBytes, "AES"),
                    new GCMParameterSpec(AUTH_TAG_LENGTH_BITS, iv));
            var plaintext = cipher.doFinal(encrypted);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException error) {
            throw new IllegalStateException("Decryption failed", error);
        }
    }
}
