package com.integrationhub.platform.service.secret;

import java.util.Map;
import java.util.Optional;

/**
 * Reads a key/value secret from a corporate secret manager (HashiCorp Vault / OpenBao
 * KV v2). Returns the secret's data map for a logical path, or empty when the manager is
 * not configured, the path is missing or the backend is unavailable (fail-safe).
 */
public interface VaultSecretClient {

    Optional<Map<String, String>> readSecret(String path);
}
