package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.task.ResumeCallbackSignature;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Optional;

/**
 * Verificacion HMAC-SHA256 del body de los callbacks de resume
 * ({@code POST /api/process-executions/resume/{token}}).
 *
 * <p>Config:</p>
 * <pre>
 *   integrationhub.resume.hmac.enabled = true            # default false
 *   integrationhub.resume.hmac.secret  = ${secret:...}   # material de clave compartido con el gateway
 * </pre>
 *
 * <p>El emisor firma el body crudo (bytes UTF-8 tal como se envian) y manda el
 * resultado hex en el header {@code X-Signature} (prefijo {@code sha256=}
 * opcional, estilo GitHub/Stripe). La comparacion es constant-time.</p>
 *
 * <p><b>Replay</b>: el token de resume es de un solo uso (consumido al
 * completar; re-suspension emite token nuevo), asi que re-enviar un request
 * firmado capturado produce 404, no un doble efecto. El HMAC agrega
 * integridad/autenticidad del body, no necesita timestamp para este flujo.</p>
 *
 * @trace spec 003 T-017 (M-2 suspension engine), ADR-009
 * @trace spec 008-mensajeria-pagos RF-019
 */
@ApplicationScoped
public class ResumeCallbackSignatureVerifier {

    private final boolean enabled;
    private final Optional<String> secret;

    @Inject
    public ResumeCallbackSignatureVerifier(
            @ConfigProperty(name = "integrationhub.resume.hmac.enabled", defaultValue = "false") boolean enabled,
            @ConfigProperty(name = "integrationhub.resume.hmac.secret") Optional<String> secret) {
        this.enabled = enabled;
        this.secret = secret;
    }

    public boolean enabled() {
        return enabled;
    }

    /**
     * Valida la firma sobre el body crudo. Solo llamar cuando {@link #enabled()}.
     *
     * @return {@code true} si la firma es valida.
     */
    public boolean verify(String rawBody, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        var key = secret.map(String::trim).filter(value -> !value.isEmpty())
                .orElseThrow(() -> new IllegalStateException(
                        "integrationhub.resume.hmac.enabled=true but integrationhub.resume.hmac.secret is not set"));
        return ResumeCallbackSignature.verifyHeader(key, rawBody, signatureHeader);
    }
}
