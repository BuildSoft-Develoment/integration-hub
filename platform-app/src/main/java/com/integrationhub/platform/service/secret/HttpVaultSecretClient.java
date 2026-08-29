package com.integrationhub.platform.service.secret;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Production adapter to HashiCorp Vault / OpenBao over its KV v2 HTTP API. Reads
 * {@code GET {address}/v1/{mount}/data/{path}} with an {@code X-Vault-Token} header and
 * returns the nested {@code data.data} map. Disabled by default: when unconfigured or on
 * any transport/parse error it returns empty so a reference simply does not resolve
 * rather than breaking the caller.
 */
@ApplicationScoped
public class HttpVaultSecretClient implements VaultSecretClient {

    private final boolean enabled;
    private final String address;
    private final String token;
    private final String kvMount;
    private final HttpClient httpClient;
    private final ObjectMapper mapper = new ObjectMapper();

    @Inject
    public HttpVaultSecretClient(
            @ConfigProperty(name = "integrationhub.secrets.vault.enabled", defaultValue = "false") boolean enabled,
            @ConfigProperty(name = "integrationhub.secrets.vault.address") Optional<String> address,
            @ConfigProperty(name = "integrationhub.secrets.vault.token") Optional<String> token,
            @ConfigProperty(name = "integrationhub.secrets.vault.kv-mount", defaultValue = "secret") String kvMount) {
        this(enabled, address.orElse(""), token.orElse(""), kvMount);
    }

    public HttpVaultSecretClient(boolean enabled, String address, String token, String kvMount) {
        this.enabled = enabled;
        this.address = address == null ? "" : address.trim();
        this.token = token == null ? "" : token.trim();
        this.kvMount = kvMount == null || kvMount.isBlank() ? "secret" : kvMount.trim();
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    }

    /**
     * La condicion ya existia dentro de {@code readSecret}; aqui solo se le pone nombre. Extraerla
     * evita que el catalogo de ADR-031 D1 diga "resuelvo vaultkv" mientras la lectura devuelve
     * vacio por la misma configuracion que el catalogo no miro.
     */
    @Override
    public boolean disponible() {
        return enabled && !address.isEmpty() && !token.isEmpty();
    }

    @Override
    public Optional<Map<String, String>> readSecret(String path) {
        if (path == null || path.isBlank()) {
            return Optional.empty();
        }
        var cuerpo = pedir("/data/" + normalizar(path));
        if (cuerpo.isEmpty()) {
            return Optional.empty();
        }
        var data = cuerpo.get().path("data").path("data");
        if (!data.isObject()) {
            return Optional.empty();
        }
        Map<String, String> values = new HashMap<>();
        data.fields().forEachRemaining(entry -> values.put(entry.getKey(), asText(entry.getValue())));
        return Optional.of(values);
    }

    @Override
    public List<String> listPaths(String prefix) {
        // LIST es un verbo propio de Vault. Se envia como GET con ?list=true porque HttpClient
        // rechaza metodos no estandar; la API lo acepta igual y es la forma documentada.
        var cuerpo = pedir("/metadata/" + normalizar(prefix) + "?list=true");
        if (cuerpo.isEmpty()) {
            return List.of();
        }
        var keys = cuerpo.get().path("data").path("keys");
        if (!keys.isArray()) {
            return List.of();
        }
        List<String> nombres = new ArrayList<>();
        keys.forEach(nodo -> nombres.add(nodo.asText()));
        return List.copyOf(nombres);
    }

    @Override
    public List<String> readFieldNames(String path) {
        // subkeys devuelve el arbol de claves con los valores a null: los nombres salen, los
        // secretos NO. Es lo que hace que este endpoint no pueda filtrar un valor por descuido.
        var cuerpo = pedir("/subkeys/" + normalizar(path));
        if (cuerpo.isEmpty()) {
            return List.of();
        }
        var subkeys = cuerpo.get().path("data").path("subkeys");
        if (!subkeys.isObject()) {
            return List.of();
        }
        List<String> nombres = new ArrayList<>();
        subkeys.fieldNames().forEachRemaining(nombres::add);
        return List.copyOf(nombres);
    }

    /**
     * Una peticion GET al mount, o vacio ante cualquier problema.
     *
     * <p>Devolver vacio y no una excepcion es deliberado (ADR-031 D3): si la politica dejara de
     * conceder {@code list}, la seleccion asistida se degrada a escritura manual en vez de romper
     * la pantalla. Un 403 aqui no es un error de la aplicacion: es una capacidad que no hay.</p>
     */
    private Optional<JsonNode> pedir(String ruta) {
        if (!disponible()) {
            return Optional.empty();
        }
        try {
            var uri = URI.create(stripTrailingSlash(address) + "/v1/" + kvMount + ruta);
            var request = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(5))
                    .header("X-Vault-Token", token)
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return Optional.empty();
            }
            return Optional.of(mapper.readTree(response.body()));
        } catch (Exception error) {
            return Optional.empty();
        }
    }

    /** Sin barras sobrantes a los lados: `connections/` y `/connections` son la misma carpeta. */
    private static String normalizar(String ruta) {
        var limpia = ruta == null ? "" : ruta.trim();
        while (limpia.startsWith("/")) {
            limpia = limpia.substring(1);
        }
        return stripTrailingSlash(limpia);
    }

    private static String asText(JsonNode node) {
        return node.isValueNode() ? node.asText() : node.toString();
    }

    private static String stripTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
