package com.integrationhub.platform.integration;

import com.integrationhub.platform.service.secret.SecretValueProvider;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.Config;

import java.util.Optional;

/**
 * Provider de secretos <b>solo para tests</b>: respalda la source {@code secret} resolviéndola desde MP
 * config, para que un {@code ${secret:prop}} se pueda resolver en un IT sin levantar un file-vault ni un
 * secret manager cloud. Es un bean regular (no {@code @DefaultBean}) → coexiste como el resolvedor de
 * "secret" en el classpath de test. Devuelve vacío para referencias no configuradas (mismo comportamiento
 * observable que el file-vault vacío por defecto), así que no cambia la semántica de los ITs existentes:
 * ninguno resuelve {@code ${secret:...}} vía CDI hoy (solo se usa en §6, {@code AsyncTaskExecutionE2EIT}).
 *
 * <p>{@code @Priority(1000)}: ahora que {@code FileVaultSecretValueProvider} ya no es {@code @DefaultBean}, ambos
 * declaran {@code supports("secret")} en el classpath de test. {@link com.integrationhub.platform.service.secret.SecretResolver}
 * inyecta los providers con {@code @All} (ordenados por prioridad descendente), así que esta prioridad alta hace que
 * este provider de test gane de forma <b>determinista</b> para la source {@code secret}.</p>
 */
@Priority(1000)
@ApplicationScoped
public class TestConfigBackedSecretValueProvider implements SecretValueProvider {

    private final Config config;

    @Inject
    public TestConfigBackedSecretValueProvider(Config config) {
        this.config = config;
    }

    @Override
    public boolean supports(String source) {
        return "secret".equalsIgnoreCase(source);
    }

    @Override
    public Optional<String> resolve(String reference) {
        return config.getOptionalValue(reference, String.class);
    }
}
