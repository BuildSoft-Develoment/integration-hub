package com.integrationhub.platform.service.secret;

// @trace ADR-031 D3, D4, D5 (enumerar rutas y nombres de campo; jamas valores)

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SecretEnumerationServiceTest {

    /**
     * Boveda de mentira con un arbol KV v2 real: las carpetas llegan con {@code /} al final.
     *
     * <p>{@code subkeysDenegado} imita el despliegue que TODAVIA no tiene las dos lineas de politica
     * de D4: lista el arbol pero no puede leer los nombres de campo. No es un caso hipotetico, es el
     * estado de integracion hasta que se recargue la politica.</p>
     */
    private static class BovedaFalsa implements VaultSecretClient {
        private final Map<String, List<String>> arbol;
        private final Map<String, List<String>> campos;
        private boolean subkeysDenegado;
        private final List<String> rutasPedidas = new ArrayList<>();

        BovedaFalsa(Map<String, List<String>> arbol, Map<String, List<String>> campos) {
            this.arbol = arbol;
            this.campos = campos;
        }

        @Override
        public Optional<Map<String, String>> readSecret(String path) {
            return Optional.empty();
        }

        @Override
        public List<String> listPaths(String prefix) {
            rutasPedidas.add(prefix);
            return arbol.getOrDefault(prefix, List.of());
        }

        @Override
        public List<String> readFieldNames(String path) {
            return subkeysDenegado ? List.of() : campos.getOrDefault(path, List.of());
        }
    }

    private static BovedaFalsa boveda() {
        return new BovedaFalsa(
                Map.of(
                        "connections", List.of("db/", "sftp-banco"),
                        "connections/db", List.of("ih-internal"),
                        "tasks", List.of("zip")),
                Map.of(
                        "connections/db/ih-internal", List.of("username", "password"),
                        "connections/sftp-banco", List.of("password"),
                        "tasks/zip", List.of("password")));
    }

    private static SecretEnumerationService servicio(VaultSecretClient cliente) {
        return new SecretEnumerationService(List.of(new VaultSecretValueProvider(cliente)));
    }

    @Test
    @DisplayName("recorre el arbol y devuelve rutas con sus nombres de campo")
    void recorreElArbol() {
        var resultado = servicio(boveda()).enumerar("vaultkv");

        assertEquals(
                List.of("connections/db/ih-internal", "connections/sftp-banco", "tasks/zip"),
                resultado.entries().stream().map(SecretEntry::path).toList());
        assertEquals(List.of("username", "password"), resultado.entries().get(0).fields());
        assertTrue(resultado.complete());
    }

    @Test
    @DisplayName("solo pide las raices que concede la politica: nunca la raiz del motor")
    void noPideLaRaizDelMotor() {
        // Pedir "" o "secret/" seria un 403 garantizado, y ademas convertiria cada carga de pantalla
        // en un intento de acceso denegado en los logs de OpenBao.
        var falsa = boveda();
        servicio(falsa).enumerar("vaultkv");

        assertFalse(falsa.rutasPedidas.contains(""));
        assertTrue(falsa.rutasPedidas.containsAll(List.of("connections", "tasks")));
    }

    @Test
    @DisplayName("sin permiso de subkeys sigue dando las rutas, con los campos vacios")
    void degradaSinSubkeys() {
        // Es D3 en accion: la funcion se degrada, no falla. La ruta por si sola ya ahorra la mitad
        // del trabajo, y el campo se escribe a mano.
        var falsa = boveda();
        falsa.subkeysDenegado = true;

        var resultado = servicio(falsa).enumerar("vaultkv");

        assertEquals(3, resultado.entries().size());
        assertTrue(resultado.entries().stream().allMatch(entrada -> entrada.fields().isEmpty()));
    }

    @Test
    @DisplayName("una fuente que no sabe enumerarse devuelve vacio, no falla")
    void fuenteNoEnumerable() {
        var service = new SecretEnumerationService(List.of(new SecretValueProvider() {
            @Override public Set<String> sources() { return Set.of("config"); }
            @Override public Optional<String> resolve(String reference) { return Optional.empty(); }
        }));

        var resultado = service.enumerar("config");

        assertTrue(resultado.entries().isEmpty());
        assertTrue(resultado.complete());
    }

    @Test
    @DisplayName("una fuente desconocida responde igual que una no enumerable")
    void fuenteDesconocida() {
        // Responder distinto convertiria esto en un detector de que proveedores tiene la maquina.
        var resultado = servicio(boveda()).enumerar("awssecret");

        assertTrue(resultado.entries().isEmpty());
        assertTrue(resultado.complete());
    }

    @Test
    @DisplayName("un proveedor presente pero no configurado no enumera")
    void noDisponibleNoEnumera() {
        var cliente = new BovedaFalsa(Map.of(), Map.of()) {
            @Override public boolean disponible() { return false; }
        };

        assertTrue(servicio(cliente).enumerar("vaultkv").entries().isEmpty());
    }

    @Test
    @DisplayName("un arbol mas hondo que el tope no cuelga: se corta y lo dice")
    void topeDeProfundidad() {
        // Cada nivel devuelve otra carpeta: sin tope, esto es un bucle infinito contra la boveda.
        var infinita = new BovedaFalsa(Map.of(), Map.of()) {
            @Override
            public List<String> listPaths(String prefix) {
                return List.of("mas/");
            }
        };

        var resultado = servicio(infinita).enumerar("vaultkv");

        assertTrue(resultado.entries().isEmpty());
    }

    @Test
    @DisplayName("mas secretos que el tope: se corta y la respuesta NO dice que eso es todo")
    void topeDeEntradas() {
        var muchas = new ArrayList<String>();
        for (int i = 0; i < VaultSecretValueProvider.MAX_ENTRADAS + 10; i++) {
            muchas.add("s" + i);
        }
        var llena = new BovedaFalsa(Map.of("connections", List.copyOf(muchas)), Map.of());

        var resultado = servicio(llena).enumerar("vaultkv");

        assertEquals(VaultSecretValueProvider.MAX_ENTRADAS, resultado.entries().size());
        assertFalse(resultado.complete());
    }

    @Test
    @DisplayName("una ruta que es secreto Y carpeta a la vez se trata como las dos cosas")
    void rutaQueEsSecretoYCarpeta() {
        // KV v2 lo permite, y OpenBao lo devuelve como dos entradas: `foo` y `foo/`.
        var mixta = new BovedaFalsa(
                Map.of("connections", List.of("banco", "banco/"), "connections/banco", List.of("sftp")),
                Map.of("connections/banco", List.of("token"), "connections/banco/sftp", List.of("password")));

        var resultado = servicio(mixta).enumerar("vaultkv");

        assertEquals(
                List.of("connections/banco", "connections/banco/sftp"),
                resultado.entries().stream().map(SecretEntry::path).toList());
    }

    @Test
    @DisplayName("SecretEntry compone la referencia que se escribe en el campo")
    void componeLaReferencia() {
        var entrada = new SecretEntry("connections/db/ih-internal", List.of("password"));

        assertEquals("${vaultkv:connections/db/ih-internal/password}", entrada.referenceFor("vaultkv", "password"));
    }
}
