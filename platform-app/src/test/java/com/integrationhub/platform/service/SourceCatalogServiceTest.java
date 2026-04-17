package com.integrationhub.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.api.response.source.SourceTestResponse;
import com.integrationhub.platform.domain.SourceType;
import com.integrationhub.platform.service.secret.ConfigSecretValueProvider;
import com.integrationhub.platform.service.secret.EnvironmentSecretValueProvider;
import com.integrationhub.platform.service.secret.FileVaultSecretClient;
import com.integrationhub.platform.service.secret.FileVaultSecretLocationMapper;
import com.integrationhub.platform.service.secret.FileVaultSecretValueProvider;
import com.integrationhub.platform.service.secret.SecretLocationMapper;
import com.integrationhub.platform.service.secret.SecretResolver;
import com.integrationhub.platform.service.secret.SecretValueProvider;
import com.integrationhub.platform.spi.SelectedSourceFile;
import com.integrationhub.platform.spi.SourcePayload;
import com.integrationhub.platform.spi.SourceProvider;
import org.eclipse.microprofile.config.ConfigProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

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
                SourceType.FILESYSTEM,
                """
                {
                  \"path\": \"/dropzone/clientes\",
                  \"password\": \"${secret:connections/db/conexion1/password}\"
                }
                """
        );

        assertEquals(new SourceTestResponse(true, "Source configuration validated successfully"), response);
    }

    @Test
    void testRejectsMissingSourceType() {
        var service = new SourceCatalogService(null, new StubSourceProviderRegistry(new NoopSourceProvider()), mapper());

        var error = assertThrows(IllegalArgumentException.class, () -> service.test("Clientes", null, "{}"));

        assertEquals("Source type is required", error.getMessage());
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
        return new JsonConfigurationMapper(new ObjectMapper(), secretResolver, true);
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
