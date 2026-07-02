package com.integrationhub.platform.service.plugin;

import java.security.PublicKey;
import java.time.Instant;

public record PluginTrustMaterial(String keyId, PublicKey publicKey, Instant expiresAt) {
    public PluginTrustMaterial {
        if (keyId == null || keyId.isBlank()) {
            throw new IllegalArgumentException("Plugin trust material keyId is required");
        }
        if (publicKey == null) {
            throw new IllegalArgumentException("Plugin trust material publicKey is required");
        }
        keyId = keyId.trim();
    }
}
