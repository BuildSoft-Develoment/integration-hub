package com.integrationhub.platform.service.secret;

import java.util.Map;
import java.util.Optional;

/**
 * Reads a key/value secret from AWS Secrets Manager. The secret value is expected to be a
 * JSON object (the standard multi-field secret shape); returns its map, or empty when the
 * manager is disabled, the secret is missing, not JSON, or the backend is unavailable
 * (fail-safe).
 */
public interface AwsSecretClient {

    Optional<Map<String, String>> readSecret(String secretId);
}
