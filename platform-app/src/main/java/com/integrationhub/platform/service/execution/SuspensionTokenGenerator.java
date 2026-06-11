package com.integrationhub.platform.service.execution;

import jakarta.enterprise.context.ApplicationScoped;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Genera tokens opacos para identificar tareas suspendidas en callbacks externos.
 *
 * <p>Implementacion: {@code SecureRandom} 32 bytes -> base64url sin padding (43 chars),
 * URL-safe para usarlo directamente en path params del REST endpoint
 * {@code POST /api/process-executions/resume/{token}}.</p>
 *
 * @trace spec 003 T-017 (M-2 suspension engine), ADR-009
 */
@ApplicationScoped
public class SuspensionTokenGenerator {

    private static final int TOKEN_BYTES = 32;

    private final SecureRandom random;

    public SuspensionTokenGenerator() {
        this.random = new SecureRandom();
    }

    SuspensionTokenGenerator(SecureRandom random) {
        this.random = random;
    }

    public String generate() {
        var bytes = new byte[TOKEN_BYTES];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
