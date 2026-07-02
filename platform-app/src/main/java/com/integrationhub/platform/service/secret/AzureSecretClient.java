package com.integrationhub.platform.service.secret;

import java.util.Map;
import java.util.Optional;

/**
 * Reads a secret from Azure Key Vault. The secret value is expected to be a JSON object
 * (multi-field secret); returns its map, or empty when disabled, missing, not JSON or the
 * backend is unavailable (fail-safe).
 */
public interface AzureSecretClient {

    Optional<Map<String, String>> readSecret(String secretName);
}
