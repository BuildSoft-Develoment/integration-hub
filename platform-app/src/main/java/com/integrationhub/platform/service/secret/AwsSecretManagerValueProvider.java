package com.integrationhub.platform.service.secret;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Optional;

/**
 * {@link SecretValueProvider} backed by AWS Secrets Manager via {@link AwsSecretClient}.
 * Bound to the {@code awssecret} source so it coexists with the local file-vault and the
 * HashiCorp Vault adapter without collision: {@code ${awssecret:area/resource/field}}
 * resolves {@code field} from the JSON secret named {@code area/resource}.
 */
@ApplicationScoped
public class AwsSecretManagerValueProvider implements SecretValueProvider {

    static final String SOURCE = "awssecret";

    private final AwsSecretClient client;

    @Inject
    public AwsSecretManagerValueProvider(AwsSecretClient client) {
        this.client = client;
    }

    @Override
    public boolean supports(String source) {
        return SOURCE.equalsIgnoreCase(source);
    }

    @Override
    public Optional<String> resolve(String reference) {
        var sanitized = reference == null ? "" : reference.strip();
        int lastSlash = sanitized.lastIndexOf('/');
        if (lastSlash <= 0 || lastSlash == sanitized.length() - 1) {
            throw new IllegalArgumentException(
                    "AWS secret reference must use area/resource/field syntax: " + reference);
        }
        var secretId = sanitized.substring(0, lastSlash);
        var field = sanitized.substring(lastSlash + 1);
        return client.readSecret(secretId).map(values -> values.get(field));
    }
}
