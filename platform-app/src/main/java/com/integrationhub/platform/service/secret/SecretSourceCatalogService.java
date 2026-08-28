package com.integrationhub.platform.service.secret;

// @trace ADR-031 D1 (el backend declara que fuentes de secreto resuelve este despliegue)

import io.quarkus.arc.All;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Comparator;
import java.util.List;

/**
 * Que fuentes de secreto resuelve ESTE despliegue, y cuales se pueden enumerar.
 *
 * <p><b>Por que existe.</b> La interfaz recomendaba {@code ${secret:...}} en todas partes. En
 * integracion eso funciona -hay un file-vault con {@code dev-secrets.p12}-, pero la VM lo omite a
 * proposito y alli esa referencia falla EN EJECUCION con "Missing secret value". El patron del
 * frontend acepta los ocho prefijos, asi que la referencia valida, guarda y pasa el bloqueo de
 * QA-006; revienta despues, en mitad de un proceso, con un mensaje indistinguible de "el secreto no
 * existe". Y no era un texto mal redactado: el frontend <b>no tenia a quien preguntar</b>. Ninguna
 * de las rutas del contrato lo exponia.</p>
 *
 * <p><b>Declarado, no presente.</b> Se listan las fuentes que el proveedor dice poder resolver
 * ({@link SecretValueProvider#disponible()}), no las que tienen un bean levantado. En produccion
 * {@code FileVaultSecretValueProvider} existe como bean y no puede trabajar; incluirlo seria repetir
 * el mismo error con mas pasos.</p>
 */
@ApplicationScoped
public class SecretSourceCatalogService {

    private final List<SecretValueProvider> providers;

    @Inject
    public SecretSourceCatalogService(@All List<SecretValueProvider> providers) {
        this.providers = List.copyOf(providers);
    }

    /**
     * Las fuentes resolubles aqui, ordenadas por nombre.
     *
     * <p>El orden es alfabetico y no por preferencia a proposito: esto es un catalogo de lo que hay,
     * no una recomendacion. Quien elige es la persona que edita, y una lista que cambiara de orden
     * segun que proveedores esten activos seria un sitio pesimo para esconder una opinion.</p>
     */
    public List<SecretSource> catalogo() {
        return providers.stream()
                .filter(SecretValueProvider::disponible)
                .flatMap(provider -> provider.sources().stream()
                        .map(source -> new SecretSource(source, provider.enumerable())))
                .distinct()
                .sorted(Comparator.comparing(SecretSource::source))
                .toList();
    }

    /**
     * Una fuente de secreto que este despliegue resuelve.
     *
     * @param source     el prefijo que se escribe en la referencia: {@code ${<source>:...}}
     * @param enumerable si sus rutas se pueden listar para ofrecerlas (ADR-031 D2, D3)
     */
    public record SecretSource(String source, boolean enumerable) {
    }
}
