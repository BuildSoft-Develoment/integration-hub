package com.integrationhub.platform.integration;

// @trace QA-006 (resolucion de secretos contra un OpenBao real: lo que los mocks no pueden probar)

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.secret.HttpVaultSecretClient;
import com.integrationhub.platform.service.secret.SecretResolver;
import com.integrationhub.platform.service.secret.SecretValueProvider;
import com.integrationhub.platform.service.secret.VaultSecretValueProvider;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * QA-006: resolucion de {@code ${vaultkv:...}} contra un <b>OpenBao real</b>.
 *
 * <h2>Por que existe</h2>
 * <p>{@code HttpVaultSecretClient} habla la API KV v2 a mano —{@code HttpClient} del JDK y Jackson, sin
 * SDK— contra {@code GET /v1/{mount}/data/{path}}. Un mock del cliente probaria mi codigo contra mi
 * propia idea de esa API, que es justo lo que no hay que dar por bueno: lo unico que demuestra que la
 * entendi es un servidor de verdad respondiendo.</p>
 *
 * <p>En concreto, lo que un mock no puede probar: que la respuesta de KV v2 anida el valor en
 * {@code data.data.<campo>} y no en {@code data.<campo>}; que el token viaje en la cabecera que el
 * servidor espera; y que partir la referencia por el ULTIMO {@code /} case con como OpenBao separa
 * ruta de campo.</p>
 *
 * <p>OpenBao es el fork libre de HashiCorp Vault y mantiene su API, asi que este IT vale para los dos.
 * Se levanta en <b>modo dev</b>: desellado, en memoria y con token raiz fijo — apropiado para un test,
 * inaceptable fuera de el.</p>
 *
 * <h2>Como se corre (cuesta acertar, y el error es silencioso)</h2>
 * <pre>
 * mvn -o -pl platform-app -Dit.test=SecretResolutionOpenBaoIT \
 *     -Dtest=NingunUnitario -Dsurefire.failIfNoSpecifiedTests=false \
 *     -Dquarkus.quinoa.enabled=false verify
 * </pre>
 *
 * <p><b>La meta tiene que ser {@code verify}</b>: failsafe corre en {@code integration-test}, posterior
 * a {@code test}, asi que con la meta {@code test} el IT no se ejecuta y el build termina en BUILD
 * SUCCESS sin haber probado nada. Y <b>no</b> vale {@code -DskipTests=true} para saltarse los
 * unitarios: failsafe tambien lo obedece y responde "Tests are skipped", otra vez en verde. Ver
 * {@link OutputSinkObjectStorageMinioIT} para el detalle de cada flag.</p>
 *
 * <p>Este IT <b>corre en CI</b> ({@code mvn -Pfast-tests verify}), asi que el runner necesita Docker.</p>
 */
class SecretResolutionOpenBaoIT {

    private static final String ROOT_TOKEN = "test-root-token";
    private static final String KV_MOUNT = "secret";

    @SuppressWarnings("resource")
    private static final GenericContainer<?> OPENBAO =
            new GenericContainer<>(DockerImageName.parse("openbao/openbao:2.6.1"))
                    .withEnv("BAO_DEV_ROOT_TOKEN_ID", ROOT_TOKEN)
                    .withEnv("BAO_DEV_LISTEN_ADDRESS", "0.0.0.0:8200")
                    .withExposedPorts(8200)
                    .waitingFor(Wait.forHttp("/v1/sys/health").forPort(8200)
                            .forStatusCode(200).withStartupTimeout(Duration.ofSeconds(60)));

    private static String address;

    @BeforeAll
    static void arrancarYSembrar() throws Exception {
        OPENBAO.start();
        address = "http://" + OPENBAO.getHost() + ":" + OPENBAO.getMappedPort(8200);

        // Dos campos en el MISMO secreto: asi el test puede demostrar que se lee el pedido y no
        // "el primero que haya", que es lo que un mock devolviendo un unico valor dejaria pasar.
        bao("kv", "put", KV_MOUNT + "/tasks/sftp/bank",
                "password=clave-del-banco", "username=usuario-del-banco");
        bao("kv", "put", KV_MOUNT + "/connections/db/conexion1", "password=clave-de-la-bd");
    }

    @AfterAll
    static void parar() {
        OPENBAO.stop();
    }

    private static void bao(String... args) throws Exception {
        var comando = new java.util.ArrayList<String>(List.of("bao"));
        comando.addAll(List.of(args));
        var salida = OPENBAO.execInContainer(
                java.util.stream.Stream.concat(
                        java.util.stream.Stream.of("env", "BAO_ADDR=http://127.0.0.1:8200",
                                "BAO_TOKEN=" + ROOT_TOKEN),
                        comando.stream()).toArray(String[]::new));
        if (salida.getExitCode() != 0) {
            throw new IllegalStateException("bao " + String.join(" ", args) + " fallo: " + salida.getStderr());
        }
    }

    private static VaultSecretValueProvider proveedor(boolean enabled, String token) {
        return new VaultSecretValueProvider(new HttpVaultSecretClient(enabled, address, token, KV_MOUNT));
    }

    // --- lo que solo un servidor real demuestra -------------------------------------------------

    @Test
    void resuelveElCampoPedidoDelSecretoPedido() {
        var resuelto = proveedor(true, ROOT_TOKEN).resolve("tasks/sftp/bank/password");

        assertEquals(Optional.of("clave-del-banco"), resuelto);
    }

    @Test
    void distingueEntreCamposDelMismoSecreto() {
        // KV v2 anida en data.data.<campo>. Si el cliente leyera data.<campo>, o cogiera el primer
        // valor del mapa, este test seria el unico que lo notaria: el otro campo existe y es distinto.
        var provider = proveedor(true, ROOT_TOKEN);

        assertEquals(Optional.of("clave-del-banco"), provider.resolve("tasks/sftp/bank/password"));
        assertEquals(Optional.of("usuario-del-banco"), provider.resolve("tasks/sftp/bank/username"));
    }

    @Test
    void laRutaPuedeTenerVariosNivelesYElCampoEsElUltimoSegmento() {
        var resuelto = proveedor(true, ROOT_TOKEN).resolve("connections/db/conexion1/password");

        assertEquals(Optional.of("clave-de-la-bd"), resuelto);
    }

    @Test
    void unaReferenciaSinFormaAreaRecursoCampoSeRechaza() {
        var provider = proveedor(true, ROOT_TOKEN);

        assertThrows(IllegalArgumentException.class, () -> provider.resolve("solounsegmento"));
        assertThrows(IllegalArgumentException.class, () -> provider.resolve("acaba/en/barra/"));
    }

    // --- el prefijo: lo que decide si hay que reescribir las referencias al migrar ---------------

    @Test
    void elPrefijoSecretNoLoAtiendeOpenBaoAunqueEsteLleno() {
        // Es la pregunta practica de la migracion: ${secret:...} NO empieza a resolverse contra OpenBao
        // por levantarlo. `secret` y `vault` son del file-vault local; `vaultkv` es este. El doble del
        // file-vault devuelve un valor DISTINTO a proposito: si el enrutado por prefijo se rompiera, el
        // test no veria un vacio ambiguo sino el valor del otro almacen.
        var fileVault = new SecretValueProvider() {
            @Override public boolean supports(String source) {
                return "secret".equalsIgnoreCase(source) || "vault".equalsIgnoreCase(source);
            }
            @Override public Optional<String> resolve(String reference) {
                return Optional.of("valor-del-file-vault");
            }
        };
        var resolver = new SecretResolver(List.of((SecretValueProvider) proveedor(true, ROOT_TOKEN), fileVault));

        assertEquals(Optional.of("clave-del-banco"), resolver.resolve("vaultkv", "tasks/sftp/bank/password"));
        assertEquals(Optional.of("valor-del-file-vault"), resolver.resolve("secret", "tasks/sftp/bank/password"));
    }

    @Test
    void unaFuenteSinProveedorFallaRuidoso() {
        var resolver = new SecretResolver(List.of((SecretValueProvider) proveedor(true, ROOT_TOKEN)));

        var error = assertThrows(IllegalArgumentException.class,
                () -> resolver.resolve("noexiste", "tasks/sftp/bank/password"));
        assertTrue(error.getMessage().contains("noexiste"), error.getMessage());
    }

    // --- el vacio nunca se convierte en credencial vacia -----------------------------------------

    @Test
    void unSecretoQueNoExisteNoSeCuelaComoCadenaVacia() {
        // El cliente devuelve vacio; quien sustituye en la configuracion tiene que romper, no dejar
        // una contrasena vacia viajando a un SFTP.
        var mapper = new JsonConfigurationMapper(new ObjectMapper(),
                new SecretResolver(List.of((SecretValueProvider) proveedor(true, ROOT_TOKEN))));

        var error = assertThrows(IllegalArgumentException.class,
                () -> mapper.resolveSecretsIn(Map.of("password", "${vaultkv:tasks/sftp/nada/password}")));
        assertTrue(error.getMessage().contains("Missing vaultkv value"), error.getMessage());
    }

    @Test
    void conElClienteApagadoNoResuelveAunqueOpenBaoEsteArriba() {
        // Documenta la trampa de diagnostico: apagado, sin permiso y "no existe" dan el MISMO vacio.
        // Con el servidor ARRIBA y el secreto PRESENTE, apagar el flag basta para no resolver nada.
        assertEquals(Optional.empty(), proveedor(false, ROOT_TOKEN).resolve("tasks/sftp/bank/password"));
    }

    @Test
    void conTokenInvalidoTampocoResuelveYNoDistingueDelCasoAnterior() {
        // Mismo vacio que arriba con un 403 de por medio. No es un fallo de seguridad —el consumidor
        // rompe igual— pero si de diagnostico, y conviene que quede fijado como comportamiento
        // conocido: si esto algun dia distingue los casos, este test debe cambiar a proposito.
        assertEquals(Optional.empty(), proveedor(true, "token-que-no-vale").resolve("tasks/sftp/bank/password"));
    }
}
