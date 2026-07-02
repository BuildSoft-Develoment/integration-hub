package com.integrationhub.platform.task;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;

/**
 * Firma compartida por sidecars/plugins y por el endpoint de resume del core.
 */
public final class ResumeCallbackSignature {

    public static final String HEADER_PREFIX = "sha256=";

    private static final String ALGORITHM = "HmacSHA256";

    private ResumeCallbackSignature() {
    }

    public static String headerValue(String secret, String rawBody) {
        return HEADER_PREFIX + signHex(secret, rawBody);
    }

    public static String signHex(String secret, String rawBody) {
        return HexFormat.of().formatHex(hmac(secret, rawBody));
    }

    public static boolean verifyHeader(String secret, String rawBody, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        var provided = signatureHeader.trim();
        if (provided.toLowerCase(Locale.ROOT).startsWith(HEADER_PREFIX)) {
            provided = provided.substring(HEADER_PREFIX.length());
        }
        byte[] providedBytes;
        try {
            providedBytes = HexFormat.of().parseHex(provided);
        } catch (IllegalArgumentException invalidHex) {
            return false;
        }
        return MessageDigest.isEqual(hmac(secret, rawBody), providedBytes);
    }

    private static byte[] hmac(String secret, String rawBody) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("Resume callback secret must not be blank");
        }
        try {
            var mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), ALGORITHM));
            return mac.doFinal((rawBody == null ? "" : rawBody).getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException | InvalidKeyException error) {
            throw new IllegalStateException("Cannot compute resume callback HMAC", error);
        }
    }
}
