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

    /**
     * Si este despliegue tiene el almacen configurado (ADR-031 D1).
     *
     * <p>El default afirma que si, porque los dobles de test y los clientes en memoria siempre
     * pueden. Lo sobrescribe quien depende de configuracion externa, que es donde esa
     * configuracion ya vive -- y no en el proveedor, para no cambiar ningun constructor.</p>
     */
    default boolean disponible() {
        return true;
    }
}
