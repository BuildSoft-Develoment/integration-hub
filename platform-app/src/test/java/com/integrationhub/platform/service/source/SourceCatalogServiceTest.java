package com.integrationhub.platform.service.source;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.api.response.source.SourceTestResponse;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.secret.ConfigSecretValueProvider;
import com.integrationhub.platform.service.secret.EnvironmentSecretValueProvider;
import com.integrationhub.platform.service.secret.FileVaultSecretClient;
import com.integrationhub.platform.service.secret.FileVaultSecretLocationMapper;
import com.integrationhub.platform.service.secret.FileVaultSecretValueProvider;
import com.integrationhub.platform.service.secret.SecretLocationMapper;
import com.integrationhub.platform.service.secret.SecretResolver;
import com.integrationhub.platform.service.secret.SecretValueProvider;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.source.SourceProvider;
import org.eclipse.microprofile.config.ConfigProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// @covers spec 001-catalogo-fuentes RF-001, RF-002 (reingenieria: prueba que cubre el/los RF en produccion)
class SourceCatalogServiceTest {

    @AfterEach
    void clearSecrets() {
        System.clearProperty("integrationhub.secrets.file-vault.default-provider");
    }

    @Test
    void testValidatesConfigurationUsingResolvedProvider() {
        System.setProperty("integrationhub.secrets.file-vault.default-provider", "dev");

        var service = new SourceCatalogService(null, new StubSourceProviderRegistry(new SourceProvider() {
            @Override
            public String type() {
                return "FILESYSTEM";
            }

            @Override
            public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
                assertEquals("/dropzone/clientes", configuration.get("path"));
                assertEquals("secret-pass", configuration.get("password"));
                return List.of(new SelectedSourceFile("clientes.csv", "/dropzone/clientes/clientes.csv", "text/csv", 12L, Instant.now()));
            }

            @Override
            public SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration) {
                throw new UnsupportedOperationException("Not needed for test");
            }
        }), mapper());

        SourceTestResponse response = service.test(
                "Clientes",
                "filesystem",
                """
                {
                  \"path\": \"/dropzone/clientes\",
                  \"password\": \"${secret:connections/db/conexion1/password}\"
                }
                """
        );

        assertEquals(new SourceTestResponse(true, "Source configuration validated successfully", "OK"), response);
    }

    @Test
    void testClassifiesMissingPathAsPathNotFound() {
        // 003: si el provider falla porque la ruta no existe, test() devuelve success=false + code PATH_NOT_FOUND
        // (no una excepcion HTTP 500) para que el frontend muestre un texto localizado.
        var service = new SourceCatalogService(null, new StubSourceProviderRegistry(new SourceProvider() {
            @Override
            public String type() {
                return "FILESYSTEM";
            }

            @Override
            public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
                throw new IllegalStateException("Filesystem path does not exist: /dropzone/no-existe");
            }

            @Override
            public SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration) {
                throw new UnsupportedOperationException("Not needed for test");
            }
        }), mapper());

        SourceTestResponse response = service.test("Clientes", "filesystem", "{ \"path\": \"/dropzone/no-existe\" }");

        assertEquals(false, response.success());
        assertEquals("PATH_NOT_FOUND", response.code());
    }

    @Test
    void createNormalizesExternalSourceTypeAsString() {
        var repository = org.mockito.Mockito.mock(com.integrationhub.platform.repository.SourceDefinitionRepository.class);
        var service = new SourceCatalogService(repository, new StubSourceProviderRegistry(new NoopSourceProvider()), mapper());

        var definition = service.create("Remota", "remote_fs", true, "{}", "output", false);

        assertEquals("REMOTE_FS", definition.sourceType);
        // ADR-016: la direccion se normaliza (case-insensitive) para el sink de FILE_DELIVER.
        assertEquals("OUTPUT", definition.direction);
        org.mockito.Mockito.verify(repository).persist(definition);
    }

    @Test
    void aBankMarkOnAnOutputSourceIsKept() {
        var repository = org.mockito.Mockito.mock(com.integrationhub.platform.repository.SourceDefinitionRepository.class);
        var service = new SourceCatalogService(repository, new StubSourceProviderRegistry(new NoopSourceProvider()), mapper());

        var definition = service.create("Banco", "sftp", true, "{}", "OUTPUT", true);

        assertTrue(definition.moneyCritical);
    }

    @Test
    void aBankMarkOnAReadSourceIsDropped() {
        // ADR-021 (E): nadie ENTREGA a una fuente de lectura, asi que la marca no protegeria nada — pero
        // dejarla guardada sugeriria una proteccion que no existe. Se normaliza a false en vez de rechazar:
        // es una combinacion sin sentido, no un intento de hacer algo peligroso.
        var repository = org.mockito.Mockito.mock(com.integrationhub.platform.repository.SourceDefinitionRepository.class);
        var service = new SourceCatalogService(repository, new StubSourceProviderRegistry(new NoopSourceProvider()), mapper());

        var definition = service.create("Lectura", "sftp", true, "{}", "INPUT", true);

        assertFalse(definition.moneyCritical);
    }

    // ── QA-006: el control que vivia SOLO en Angular. Un POST directo lo saltaba entero.

    @Test
    void createRechazaUnaCredencialEnTextoPlano() {
        var service = servicioConProviderDeCredenciales();

        var error = assertThrows(IllegalArgumentException.class,
                () -> service.create("Banco", "SFTP", true, "{\"host\":\"h\",\"password\":\"hunter2\"}", "INPUT", false));

        assertTrue(error.getMessage().contains("password"), () -> error.getMessage());
        assertTrue(error.getMessage().contains("QA-006"), () -> error.getMessage());
    }

    @Test
    void updateRechazaTambien() {
        // El agujero estaba en apply(), que comparten create y update: si solo se cubriera create,
        // bastaria crear la fuente vacia y editarla despues para colar el secreto.
        var repository = org.mockito.Mockito.mock(com.integrationhub.platform.repository.SourceDefinitionRepository.class);
        org.mockito.Mockito.when(repository.findRequired(7L))
                .thenReturn(new com.integrationhub.platform.entity.SourceDefinition());
        var service = new SourceCatalogService(repository,
                new StubSourceProviderRegistry(new CredentialSourceProvider()), mapper());

        assertThrows(IllegalArgumentException.class,
                () -> service.update(7L, "Banco", "SFTP", true, "{\"password\":\"hunter2\"}", "INPUT", false));
    }

    @Test
    void aceptaLaCredencialComoReferencia() {
        var repository = org.mockito.Mockito.mock(com.integrationhub.platform.repository.SourceDefinitionRepository.class);
        var service = new SourceCatalogService(repository,
                new StubSourceProviderRegistry(new CredentialSourceProvider()), mapper());

        var definition = service.create("Banco", "SFTP", true,
                "{\"password\":\"${secret:sftp/pass}\"}", "INPUT", false);

        assertEquals("SFTP", definition.sourceType);
    }

    @Test
    void noBloqueaUnCampoDeCredencialVacio() {
        // REST con bearer no serializa `password`, S3 con rol IAM no serializa `secretAccessKey`.
        // Tratar el vacio como secreto seria un falso bloqueo, y un falso bloqueo acaba en que
        // alguien desactiva el control.
        var repository = org.mockito.Mockito.mock(com.integrationhub.platform.repository.SourceDefinitionRepository.class);
        var service = new SourceCatalogService(repository,
                new StubSourceProviderRegistry(new CredentialSourceProvider()), mapper());

        var definition = service.create("Banco", "SFTP", true, "{\"password\":\"\",\"host\":\"h\"}", "INPUT", false);

        assertEquals("SFTP", definition.sourceType);
    }

    @Test
    void rechazaUnaReferenciaAMEDIAS() {
        // `pass${secret:x}word` deja media credencial en claro en la base de datos.
        var service = servicioConProviderDeCredenciales();

        assertThrows(IllegalArgumentException.class,
                () -> service.create("Banco", "SFTP", true, "{\"password\":\"pass${secret:x}word\"}", "INPUT", false));
    }

    private SourceCatalogService servicioConProviderDeCredenciales() {
        var repository = org.mockito.Mockito.mock(com.integrationhub.platform.repository.SourceDefinitionRepository.class);
        return new SourceCatalogService(repository,
                new StubSourceProviderRegistry(new CredentialSourceProvider()), mapper());
    }

    @Test
    void testRejectsMissingSourceType() {
        var service = new SourceCatalogService(null, new StubSourceProviderRegistry(new NoopSourceProvider()), mapper());

        var error = assertThrows(IllegalArgumentException.class, () -> service.test("Clientes", null, "{}"));

        assertEquals("Source type is required", error.getMessage());
    }

    @Test
    void createRejectsBlankName() {
        // CSRC-09: no se puede crear una fuente con el nombre vacio/en blanco (validacion server-side).
        var service = new SourceCatalogService(null, new StubSourceProviderRegistry(new NoopSourceProvider()), mapper());

        var error = assertThrows(IllegalArgumentException.class,
                () -> service.create("   ", "sftp", true, "{}", "INPUT", false));

        assertEquals("Source name is required", error.getMessage());
    }

    private JsonConfigurationMapper mapper() {
        var config = ConfigProvider.getConfig();
        var configProvider = new ConfigSecretValueProvider(config);
        SecretValueProvider envProvider = new EnvironmentSecretValueProvider(config);
        FileVaultSecretClient fileVaultSecretClient = (providerName, alias) -> {
            if ("dev".equals(providerName) && "connections/db/conexion1".equals(alias)) {
                return Optional.of(Map.of("password", "secret-pass"));
            }
            return Optional.empty();
        };
        SecretLocationMapper<FileVaultSecretLocationMapper.FileVaultLocation> locationMapper =
                new FileVaultSecretLocationMapper(config, true);
        SecretValueProvider vaultProvider = new FileVaultSecretValueProvider(fileVaultSecretClient, locationMapper, true);
        SecretResolver secretResolver = new SecretResolver(List.of(envProvider, configProvider, vaultProvider));
        return new JsonConfigurationMapper(new ObjectMapper(), secretResolver);
    }

    private static final class StubSourceProviderRegistry extends SourceProviderRegistry {
        private final SourceProvider provider;

        private StubSourceProviderRegistry(SourceProvider provider) {
            super(null);
            this.provider = provider;
        }

        @Override
        public SourceProvider resolve(String type) {
            if (provider.type().equalsIgnoreCase(type)) {
                return provider;
            }
            throw new IllegalArgumentException("Unsupported source provider: " + type);
        }
    }

    /** Provider con credenciales declaradas, para ejercitar QA-006 en el servidor. */
    private static final class CredentialSourceProvider implements SourceProvider {
        @Override
        public String type() {
            return "SFTP";
        }

        @Override
        public List<String> credentialKeys() {
            return List.of("password", "passphrase");
        }

        @Override
        public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
            return List.of();
        }

        @Override
        public SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration) {
            throw new UnsupportedOperationException();
        }
    }

    private static final class NoopSourceProvider implements SourceProvider {
        @Override
        public String type() {
            return "FILESYSTEM";
        }

        @Override
        public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
            return List.of();
        }

        @Override
        public SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration) {
            return null;
        }
    }
}
