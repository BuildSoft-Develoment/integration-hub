package com.integrationhub.platform.service.secret;

import java.util.Map;
import java.util.Optional;

/**
 * Reads a secret from GCP Secret Manager. The payload is expected to be a JSON object
 * (multi-field secret); returns its map, or empty when disabled, missing, not JSON or the
 * backend is unavailable (fail-safe).
 */
public interface GcpSecretClient {

    Optional<Map<String, String>> readSecret(String secretId);
}
