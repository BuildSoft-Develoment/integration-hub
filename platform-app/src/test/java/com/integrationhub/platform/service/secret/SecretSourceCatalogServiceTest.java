package com.integrationhub.platform.service.secret;

// @trace ADR-031 D1 (el backend declara que fuentes resuelve ESTE despliegue)

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SecretSourceCatalogServiceTest {

    private static List<String> nombres(SecretSourceCatalogService service) {
        return service.catalogo().stream().map(SecretSourceCatalogService.SecretSource::source).toList();
    }

    /** Proveedor de prueba: declara sus fuentes, si puede trabajar, y si se puede enumerar. */
    private static SecretValueProvider proveedor(Set<String> fuentes, boolean disponible, boolean enumerable) {
        return new SecretValueProvider() {
            @Override public Set<String> sources() { return fuentes; }
            @Override public boolean disponible() { return disponible; }
            @Override public boolean enumerable() { return enumerable; }
            @Override public Optional<String> resolve(String reference) { return Optional.empty(); }
        };
    }

    @Test
    @DisplayName("un proveedor presente pero no configurado NO aparece en el catalogo")
    void elNoDisponibleNoSale() {
        // Es el caso de la VM: FileVaultSecretValueProvider existe como bean y no tiene keystore,
        // asi que ${secret:...} falla EN EJECUCION. Incluirlo aqui repetiria ese fallo con mas pasos.
        var service = new SecretSourceCatalogService(List.of(
                proveedor(Set.of("vaultkv"), true, true),
                proveedor(Set.of("secret", "vault"), false, false)));

        assertEquals(List.of("vaultkv"), nombres(service));
    }

    @Test
    @DisplayName("un proveedor con varias fuentes las aporta todas, ordenadas")
    void variasFuentesYOrden() {
        var service = new SecretSourceCatalogService(List.of(
                proveedor(Set.of("vaultkv"), true, true),
                proveedor(Set.of("secret", "vault"), true, false),
                proveedor(Set.of("env"), true, false)));

        assertEquals(List.of("env", "secret", "vault", "vaultkv"), nombres(service));
    }

    @Test
    @DisplayName("enumerable viaja por fuente, no es una propiedad global")
    void enumerablePorFuente() {
        var service = new SecretSourceCatalogService(List.of(
                proveedor(Set.of("vaultkv"), true, true),
                proveedor(Set.of("config"), true, false)));

        assertEquals(List.of(
                new SecretSourceCatalogService.SecretSource("config", false),
                new SecretSourceCatalogService.SecretSource("vaultkv", true)), service.catalogo());
    }

    @Test
    @DisplayName("sin ningun proveedor disponible el catalogo esta vacio, no falla")
    void catalogoVacio() {
        // Un despliegue sin ninguna fuente resoluble es una configuracion valida -y muy rota-, pero
        // la pantalla tiene que poder pintarse para contarlo. Fallar aqui la dejaria en blanco.
        var service = new SecretSourceCatalogService(List.of(
                proveedor(Set.of("vaultkv"), false, true)));

        assertTrue(service.catalogo().isEmpty());
    }

    @Test
    @DisplayName("supports() se deriva de sources(): no pueden divergir")
    void supportsDerivado() {
        var p = proveedor(Set.of("vaultkv"), true, true);

        assertTrue(p.supports("vaultkv"));
        assertTrue(p.supports("VAULTKV"));
        assertFalse(p.supports("secret"));
        assertFalse(p.supports(null));
    }
}
