package com.integrationhub.platform.service.secret;

// @trace ADR-031 D1 (la interfaz ofrece las referencias que ESTE despliegue resuelve)

import java.util.Optional;
import java.util.Set;

public interface SecretValueProvider {

    /**
     * Prefijos que este proveedor atiende: {@code ${<source>:...}}.
     *
     * <p><b>Abstracto a proposito.</b> Un {@code default} que devolviera el conjunto vacio
     * convertiria un olvido en la afirmacion "este proveedor no atiende ninguna fuente", que es
     * justo el error que {@code SourceProvider.credentialKeys()} documenta como trampa. Aqui ademas
     * seria invisible: el proveedor desapareceria del catalogo de ADR-031 D1 sin que nada falle.</p>
     */
    Set<String> sources();

    /**
     * Antes cada proveedor repetia su nombre aqui y en su constante. Ahora se deriva de
     * {@link #sources()}: una sola fuente de verdad, y ninguna posibilidad de que un proveedor
     * declare una fuente en el catalogo y resuelva otra distinta en ejecucion.
     */
    default boolean supports(String source) {
        if (source == null) {
            return false;
        }
        return sources().stream().anyMatch(declarada -> declarada.equalsIgnoreCase(source));
    }

    Optional<String> resolve(String reference);

    /**
     * Si este despliegue puede resolver de verdad las fuentes que declara (ADR-031 D1).
     *
     * <p><b>Por que existe.</b> Un proveedor puede estar presente como bean y no poder trabajar:
     * {@code FileVaultSecretValueProvider} vive en el contenedor de produccion, pero alli no hay
     * keystore configurado y {@code ${secret:...}} falla EN EJECUCION con "Missing config value".
     * Nada lo detecta al guardar, y la interfaz sigue recomendando ese prefijo. Preguntarlo es lo
     * que permite que la pantalla deje de adivinar.</p>
     *
     * <p>El default es {@code true} porque la mayoria no necesita configuracion —{@code config} y
     * {@code env} siempre pueden—; quien si la necesita lo delega en su cliente, que es donde vive
     * esa configuracion.</p>
     */
    default boolean disponible() {
        return true;
    }

    /**
     * Si sus rutas se pueden enumerar para ofrecerlas en un desplegable (ADR-031 D2, D3).
     *
     * <p>Hoy solo {@code vaultkv}: la politica de OpenBao ya concede {@code list} sobre
     * {@code secret/metadata/connections/*} y {@code tasks/*} —comprobado ejecutandolo—. Los
     * gestores de nube exigirian permisos IAM que este despliegue no tiene, y {@code config}/
     * {@code env} no son un arbol que tenga sentido enumerar.</p>
     *
     * <p>El default es {@code false} porque no poder enumerar es lo normal, y porque el campo sigue
     * aceptando texto libre (D2): equivocarse aqui degrada la ayuda, no rompe el guardado.</p>
     */
    default boolean enumerable() {
        return false;
    }
}
