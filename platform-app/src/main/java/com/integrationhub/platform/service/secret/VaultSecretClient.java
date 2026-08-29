package com.integrationhub.platform.service.secret;

import java.util.List;
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
     * Los nombres que cuelgan de {@code prefix}, con {@code /} al final los que son carpeta
     * (ADR-031 D3). Vacio si no se puede listar: la funcion se degrada, no falla.
     *
     * <p>Va contra {@code <mount>/metadata/...}, que es donde KV v2 guarda el arbol. La politica de
     * la aplicacion ya concede {@code list} ahi —no hace falta ampliarla— y por metadata NO viajan
     * valores.</p>
     */
    default List<String> listPaths(String prefix) {
        return List.of();
    }

    /**
     * Los NOMBRES de campo de un secreto, sin sus valores (ADR-031 D4).
     *
     * <p>Se lee por {@code <mount>/subkeys/...}, <b>nunca</b> por {@code <mount>/data/...}. No es
     * una preferencia de estilo: por {@code data} el backend tendria los secretos en memoria y la
     * seguridad dependeria de que nadie escriba {@code return values} en un refactor de dentro de
     * dos anos. Por {@code subkeys} los valores no salen de la boveda, y el modo seguro deja de
     * depender de la memoria de quien mantiene el codigo.</p>
     */
    default List<String> readFieldNames(String path) {
        return List.of();
    }

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
