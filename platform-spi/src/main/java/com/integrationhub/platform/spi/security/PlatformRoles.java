package com.integrationhub.platform.spi.security;

/**
 * ADR-021: roles de la plataforma. Son vocabulario COMPARTIDO — el motor los usa para proteger sus
 * endpoints y un vertical los usa para proteger los suyos, asi que viven en el contrato.
 *
 * <p>Aca van solo los roles transversales. Los que son de un vertical van con el vertical (ver
 * {@code Mt101Roles}): si el motor nombrara los roles de un estandar, cada estandar nuevo obligaria
 * a editar el motor — exactamente lo que ADR-021 evita.</p>
 */
public final class PlatformRoles {

    public static final String PLATFORM_ADMIN = "platform-admin";
    public static final String INTEGRATION_ADMIN = "integration-admin";
    public static final String OPERATOR = "operator";
    public static final String PAYMENTS_OPERATOR = "payments-operator";
    public static final String AUDITOR = "auditor";

    private PlatformRoles() {
    }
}
