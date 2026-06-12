package com.integrationhub.platform.service.execution;

import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 003 T-017 (M-2 suspension engine), ADR-009
 */
class ResumeCallbackSignatureVerifierTest {

    private static final String SECRET = "shared-gateway-secret";
    private static final String BODY = "{\"confirmations\":[{\"sendersReference\":\"P1\",\"status\":\"ACCP\"}]}";

    @Test
    void acceptsValidSignature() throws Exception {
        var verifier = new ResumeCallbackSignatureVerifier(true, Optional.of(SECRET));
        assertTrue(verifier.verify(BODY, sign(SECRET, BODY)));
    }

    @Test
    void acceptsGithubStylePrefix() throws Exception {
        var verifier = new ResumeCallbackSignatureVerifier(true, Optional.of(SECRET));
        assertTrue(verifier.verify(BODY, "sha256=" + sign(SECRET, BODY)));
    }

    @Test
    void rejectsTamperedBody() throws Exception {
        var verifier = new ResumeCallbackSignatureVerifier(true, Optional.of(SECRET));
        var signature = sign(SECRET, BODY);
        assertFalse(verifier.verify(BODY.replace("ACCP", "RJCT"), signature),
                "body alterado debe invalidar la firma");
    }

    @Test
    void rejectsWrongSecret() throws Exception {
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

    private String sign(String secret, String body) throws Exception {
        var mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
    }
}
