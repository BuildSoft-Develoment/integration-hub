package com.integrationhub.platform.service.secret;

import com.integrationhub.platform.integration.PostgresTestResource;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Map;

/**
 * Cobertura de la que carecía el proyecto y que dejó pasar el bug de {@code @DefaultBean}: resolver secretos a través
 * del {@link SecretResolver} <b>inyectado por el contenedor CDI</b>, no uno construido a mano en el test.
 *
 * <p>Con {@code @DefaultBean} en los providers locales, ArC los eliminaba del {@code Instance<SecretValueProvider>}
 * porque existían beans no-default del mismo tipo (aws/azure/gcp/vault) → {@code ${config:...}}, {@code ${env:...}} y
 * {@code ${secret:...}} eran irresolubles en runtime ("Unsupported secret source: ..."). Este IT falla si esa
 * regresión vuelve.</p>
 */
@QuarkusTest
@TestProfile(SecretResolverCdiWiringIT.Profile.class)
@QuarkusTestResource(PostgresTestResource.class)
class SecretResolverCdiWiringIT {

    public static class Profile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of(
                    "quarkus.oidc.enabled", "false",
                    "quarkus.scheduler.enabled", "false",
                    "quarkus.devservices.enabled", "false",
                    "quarkus.flyway.migrate-at-start", "true",
                    // fuente 'config' (ConfigSecretValueProvider) resuelve la referencia como clave MP config
                    "integrationhub.test.cdi-secret", "valor-config-cdi",
                    // fuente 'secret' (TestConfigBackedSecretValueProvider, @Priority alta) también lee MP config
                    "tasks/sftp/bank/password", "bank-cdi");
        }
    }

    @Inject
    SecretResolver secretResolver;

    @Test
    void resolvesConfigSourceThroughContainerWiring() {
        // Si ConfigSecretValueProvider no estuviera en el contenedor (regresión @DefaultBean), esto lanzaría
        // "Unsupported secret source: config".
        var resolved = secretResolver.resolve("config", "integrationhub.test.cdi-secret");
        Assertions.assertTrue(resolved.isPresent(), "la fuente 'config' debe estar cableada por CDI");
        Assertions.assertEquals("valor-config-cdi", resolved.get());
    }

    @Test
    void resolvesSecretSourceDeterministicallyThroughContainerWiring() {
        // 'secret' lo cubren dos providers en test (FileVault + TestConfigBacked). Con @All + @Priority el de test
        // gana de forma determinista. Sin cableado CDI de la fuente 'secret', esto lanzaría "Unsupported secret source".
        var resolved = secretResolver.resolve("secret", "tasks/sftp/bank/password");
        Assertions.assertTrue(resolved.isPresent(), "la fuente 'secret' debe estar cableada por CDI");
        Assertions.assertEquals("bank-cdi", resolved.get());
    }

    @Test
    void unknownSourceStillFailsLoud() {
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> secretResolver.resolve("no-such-source", "x"));
    }
}
