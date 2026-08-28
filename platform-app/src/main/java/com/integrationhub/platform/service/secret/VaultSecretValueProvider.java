package com.integrationhub.platform.service.secret;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * {@link SecretValueProvider} backed by a corporate secret manager (HashiCorp Vault /
 * OpenBao KV v2) via {@link VaultSecretClient}. Bound to the {@code vaultkv} source so it
 * coexists with the local file-vault ({@code secret}/{@code vault}) without collision:
 * {@code ${vaultkv:area/resource/field}} resolves {@code field} from the KV secret at
 * {@code area/resource}.
 */
@ApplicationScoped
public class VaultSecretValueProvider implements SecretValueProvider {

    static final String SOURCE = "vaultkv";

    /**
     * Cuantas carpetas de hondo se recorre, y cuantos secretos se devuelven como mucho.
     *
     * <p>No son numeros magicos con vocacion de configuracion: son un tope para que un arbol
     * inesperadamente grande no convierta una carga de pantalla en cientos de peticiones a la
     * boveda. Cuando se tocan, la respuesta lo dice ({@code complete:false}); lo que no se hace es
     * recortar en silencio.</p>
     */
    private static final Logger LOG = Logger.getLogger(VaultSecretValueProvider.class);

    static final int MAX_PROFUNDIDAD = 6;

    static final int MAX_ENTRADAS = 200;

    private final VaultSecretClient client;

    private final List<String> raices;

    @Inject
    public VaultSecretValueProvider(
            VaultSecretClient client,
            @ConfigProperty(
                            name = "integrationhub.secrets.vault.enumerable-roots",
                            defaultValue = "connections,tasks")
                    List<String> raices) {
        this.client = client;
        this.raices = List.copyOf(raices);
    }

    /** Para tests y para quien no quiera nombrar las raices: las dos que concede la politica. */
    public VaultSecretValueProvider(VaultSecretClient client) {
        this(client, List.of("connections", "tasks"));
    }

    @Override
    public Set<String> sources() {
        return Set.of(SOURCE);
    }

    /** Lo sabe el cliente: habilitado, con direccion y con token. */
    @Override
    public boolean disponible() {
        return client.disponible();
    }

    /**
     * La unica fuente enumerable hoy. La politica de la aplicacion en OpenBao ya concede
     * {@code list} sobre {@code secret/metadata/connections/*} y {@code tasks/*} -- comprobado
     * ejecutandolo contra un OpenBao 2.6.1 con esa politica exacta, a cuatro niveles de
     * profundidad, con la raiz del motor denegada.
     */
    @Override
    public boolean enumerable() {
        return true;
    }

    /**
     * Recorre las raices que la politica concede y devuelve lo que hay.
     *
     * <p>Las raices son configurables y por defecto son {@code connections} y {@code tasks}, que son
     * EXACTAMENTE las dos que concede {@code policy-integration-hub.hcl}. Listarlas aqui no es
     * duplicar la politica: es no pedir lo que se sabe que sera 403. Si alguien amplia la politica,
     * amplia la propiedad, sin tocar codigo.</p>
     */
    @Override
    public SecretEnumeration enumerate() {
        if (!disponible()) {
            return SecretEnumeration.vacia();
        }
        List<SecretEntry> encontrados = new ArrayList<>();
        for (var raiz : raices) {
            recorrer(raiz, encontrados, 0);
        }
        var completa = encontrados.size() < MAX_ENTRADAS;
        if (!completa) {
            LOG.warnf(
                    "Enumeracion de secretos truncada en %d entradas: la interfaz lo dira, no se recorta en silencio.",
                    MAX_ENTRADAS);
        }
        return new SecretEnumeration(
                encontrados.stream().sorted(Comparator.comparing(SecretEntry::path)).toList(), completa);
    }

    /**
     * Un nivel del arbol KV v2: los nombres terminados en {@code /} son carpeta, el resto secretos.
     *
     * <p>Una misma ruta puede ser las dos cosas —{@code foo} y {@code foo/} llegan como entradas
     * distintas—, y por eso no hay {@code else if}: se tratan las dos.</p>
     */
    private void recorrer(String prefijo, List<SecretEntry> acumulado, int profundidad) {
        if (profundidad >= MAX_PROFUNDIDAD || acumulado.size() >= MAX_ENTRADAS) {
            return;
        }
        for (var nombre : client.listPaths(prefijo)) {
            if (acumulado.size() >= MAX_ENTRADAS) {
                return;
            }
            var esCarpeta = nombre.endsWith("/");
            var hoja = esCarpeta ? nombre.substring(0, nombre.length() - 1) : nombre;
            var ruta = prefijo + "/" + hoja;
            if (esCarpeta) {
                recorrer(ruta, acumulado, profundidad + 1);
            } else {
                // Se anade aunque no haya campos: sin las dos lineas de politica de D4 el nombre de
                // campo no se puede leer, y la ruta por si sola sigue ahorrando la mitad del trabajo.
                acumulado.add(new SecretEntry(ruta, client.readFieldNames(ruta)));
            }
        }
    }

    @Override
    public Optional<String> resolve(String reference) {
        var sanitized = reference == null ? "" : reference.strip();
        int lastSlash = sanitized.lastIndexOf('/');
        if (lastSlash <= 0 || lastSlash == sanitized.length() - 1) {
            throw new IllegalArgumentException(
                    "Vault secret reference must use area/resource/field syntax: " + reference);
        }
        var secretPath = sanitized.substring(0, lastSlash);
        var field = sanitized.substring(lastSlash + 1);
        return client.readSecret(secretPath).map(values -> values.get(field));
    }
}
