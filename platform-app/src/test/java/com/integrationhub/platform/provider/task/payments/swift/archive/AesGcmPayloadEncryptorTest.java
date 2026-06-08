package com.integrationhub.platform.provider.task.payments.swift.archive;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-014, RF-021, T-020
 */
class AesGcmPayloadEncryptorTest {

    private static final String KEY = "test-key-for-payment-archive";
    private static final String PLAINTEXT = "{\"sequenceA\":{\"sendersReference\":\"PROC-42\"}}";

    @Test
    void encryptsAndDecryptsRoundtrip() {
        var encryptor = new AesGcmPayloadEncryptor(KEY);
        var ciphertext = encryptor.encrypt(PLAINTEXT);
        assertTrue(ciphertext.startsWith("AES-GCM-256:"));
        assertNotEquals(PLAINTEXT, ciphertext);
        assertEquals(PLAINTEXT, encryptor.decrypt(ciphertext));
    }

    @Test
    void producesDifferentCiphertextForSamePlaintext() {
        var encryptor = new AesGcmPayloadEncryptor(KEY);
        var first = encryptor.encrypt(PLAINTEXT);
        var second = encryptor.encrypt(PLAINTEXT);
        assertNotEquals(first, second, "IV aleatorio debe producir distintos ciphertexts");
        assertEquals(encryptor.decrypt(first), encryptor.decrypt(second));
    }

    @Test
    void decryptWithWrongKeyFails() {
        var encryptor = new AesGcmPayloadEncryptor(KEY);
        var ciphertext = encryptor.encrypt(PLAINTEXT);
        var wrongKey = new AesGcmPayloadEncryptor("otra-clave-distinta");
        assertThrows(IllegalStateException.class, () -> wrongKey.decrypt(ciphertext));
    }

    @Test
    void decryptRejectsForeignFormat() {
        var encryptor = new AesGcmPayloadEncryptor(KEY);
        assertThrows(IllegalArgumentException.class, () -> encryptor.decrypt("plain text not encrypted"));
        assertThrows(IllegalArgumentException.class, () -> encryptor.decrypt(null));
    }

    @Test
    void rejectsBlankKey() {
        assertThrows(IllegalArgumentException.class, () -> new AesGcmPayloadEncryptor(""));
        assertThrows(IllegalArgumentException.class, () -> new AesGcmPayloadEncryptor(null));
    }

    @Test
    void rejectsNullPlaintext() {
        var encryptor = new AesGcmPayloadEncryptor(KEY);
        assertThrows(IllegalArgumentException.class, () -> encryptor.encrypt(null));
    }

    @Test
    void preservesUtf8Content() {
        var encryptor = new AesGcmPayloadEncryptor(KEY);
        var withSpecialChars = "MT101 con ñ, á, ü, € y caracteres > <";
        var ciphertext = encryptor.encrypt(withSpecialChars);
        // El ciphertext es Base64 puro, no debe contener los caracteres especiales
        assertFalse(ciphertext.contains("ñ"));
        assertEquals(withSpecialChars, encryptor.decrypt(ciphertext));
    }

    @Test
    void algorithmIdMatchesSpec() {
        assertEquals("AES-GCM-256", new AesGcmPayloadEncryptor(KEY).algorithm());
    }
}
