package com.integrationhub.platform.api.response.branding;

/**
 * Branding publico (no sensible) para pintar el login/pantallas pre-auth: nombre, marca corta,
 * logo embebido y color primario. Espejo de lo que el admin configura en preferencias.
 */
public record BrandingResponse(
        String brandName,
        String brandMark,
        String logoDataUri,
        String primaryColor) {
}
