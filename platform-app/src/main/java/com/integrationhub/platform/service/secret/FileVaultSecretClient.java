package com.integrationhub.platform.service.secret;

import java.util.Map;
import java.util.Optional;

public interface FileVaultSecretClient {

    Optional<Map<String, String>> readSecret(String providerName, String alias);
}
