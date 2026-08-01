package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.task.ResumeCallbackSignature;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 003-diseno-y-ejecucion-procesos T-017 (M-2 suspension engine), ADR-009
 */
class ResumeCallbackSignatureVerifierTest {

    private static final String SECRET = "shared-gateway-secret";
    private static final String BODY = "{\"confirmations\":[{\"sendersReference\":\"P1\",\"status\":\"ACCP\"}]}";

    @Test
    void acceptsValidSignature() {
        var verifier = new ResumeCallbackSignatureVerifier(true, Optional.of(SECRET));
        assertTrue(verifier.verify(BODY, sign(SECRET, BODY)));
    }

    @Test
    void acceptsGithubStylePrefix() {
        var verifier = new ResumeCallbackSignatureVerifier(true, Optional.of(SECRET));
        assertTrue(verifier.verify(BODY, ResumeCallbackSignature.headerValue(SECRET, BODY)));
    }

    @Test
    void rejectsTamperedBody() {
        var verifier = new ResumeCallbackSignatureVerifier(true, Optional.of(SECRET));
        var signature = sign(SECRET, BODY);
        assertFalse(verifier.verify(BODY.replace("ACCP", "RJCT"), signature),
                "body alterado debe invalidar la firma");
    }

    @Test
    void rejectsWrongSecret() {
        var verifier = new ResumeCallbackSignatureVerifier(true, Optional.of(SECRET));
        assertFalse(verifier.verify(BODY, sign("other-secret", BODY)));
    }

    @Test
    void rejectsMissingOrMalformedSignature() {
        var verifier = new ResumeCallbackSignatureVerifier(true, Optional.of(SECRET));
        assertFalse(verifier.verify(BODY, null));
        assertFalse(verifier.verify(BODY, "  "));
        assertFalse(verifier.verify(BODY, "not-hex!!"));
    }

    @Test
    void enabledWithoutSecretFailsLoudly() {
        var verifier = new ResumeCallbackSignatureVerifier(true, Optional.empty());
        var error = assertThrows(IllegalStateException.class, () -> verifier.verify(BODY, "00"));
        assertTrue(error.getMessage().contains("integrationhub.resume.hmac.secret"));
    }

    @Test
    void disabledByDefault() {
        var verifier = new ResumeCallbackSignatureVerifier(false, Optional.empty());
        assertFalse(verifier.enabled());
    }

    private String sign(String secret, String body) {
        return ResumeCallbackSignature.signHex(secret, body);
    }
}
