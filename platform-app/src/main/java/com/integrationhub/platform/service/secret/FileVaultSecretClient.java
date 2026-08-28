package com.integrationhub.platform.service.secret;

import java.util.Map;
import java.util.Optional;

public interface FileVaultSecretClient {

    Optional<Map<String, String>> readSecret(String providerName, String alias);

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
