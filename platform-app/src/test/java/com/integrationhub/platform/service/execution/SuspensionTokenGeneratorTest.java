package com.integrationhub.platform.service.execution;

import org.junit.jupiter.api.Test;

import java.security.SecureRandom;
import java.util.HashSet;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 003 T-017 (M-2 suspension engine), ADR-009
 */
class SuspensionTokenGeneratorTest {

    private static final Pattern URL_SAFE_BASE64 = Pattern.compile("^[A-Za-z0-9_-]+$");

    @Test
    void generatesUrlSafeBase64WithoutPadding() {
        var token = new SuspensionTokenGenerator().generate();
        assertTrue(URL_SAFE_BASE64.matcher(token).matches(),
                () -> "expected url-safe base64 without padding, got: " + token);
    }

    @Test
    void generatesTokensOfExpectedLength() {
        // 32 bytes random -> 43 chars en base64url sin padding (ceil(32 * 4 / 3) = 43).
        var token = new SuspensionTokenGenerator().generate();
        assertEquals(43, token.length());
    }

    @Test
    void generatesUniqueTokensAcrossManyCalls() {
        var generator = new SuspensionTokenGenerator();
        var seen = new HashSet<String>();
        for (int i = 0; i < 1000; i++) {
            assertTrue(seen.add(generator.generate()), "colision en token " + i);
        }
    }

    @Test
    void exposesPackagePrivateConstructorForInjectedSecureRandom() {
        // No verificamos determinismo (SecureRandom(byte[]) NO es un seed reproducible;
        // anade entropia al estado global). Solo confirmamos que la API permite
        // inyectar un SecureRandom alternativo para tests de integracion mas adelante.
        var generator = new SuspensionTokenGenerator(new SecureRandom());
        var token = generator.generate();
        assertEquals(43, token.length());
    }
}
