package com.integrationhub.vertical.swift.mt101.provider.archive;

/**
 * SPI minimo para cifrar/decifrar el {@code raw_payload} de {@code mt101_archive}.
 *
 * <p>La implementacion default {@link AesGcmPayloadEncryptor} resuelve la clave desde
 * un secreto ({@code ${secret:...}}) o variable de entorno. Implementaciones
 * alternativas (HSM, KMS) pueden registrarse via CDI con {@code @Priority} mayor.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-014, RF-021, T-020
 * @trace ADR-009
 */
public interface PayloadEncryptor {

    /** Identificador del algoritmo/strategia: {@code AES-GCM-256}, {@code KMS-AWS}, etc. */
    String algorithm();

    /**
     * Cifra el texto plano y devuelve el blob cifrado en formato textual seguro
     * (base64 + tag de algoritmo). Idempotente respecto a la misma clave.
     *
     * @param plaintext texto plano (no nulo).
     * @return blob cifrado serializable a una columna {@code text}.
     */
    String encrypt(String plaintext);

    /**
     * Descifra un blob producido por {@link #encrypt(String)} con la misma clave.
     *
     * @throws IllegalArgumentException si el blob no es valido para esta strategia.
     */
    String decrypt(String ciphertext);
}
