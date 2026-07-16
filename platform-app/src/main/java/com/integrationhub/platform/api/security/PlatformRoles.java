package com.integrationhub.platform.api.security;

public final class PlatformRoles {

    public static final String PLATFORM_ADMIN = "platform-admin";
    public static final String INTEGRATION_ADMIN = "integration-admin";
    public static final String OPERATOR = "operator";
    public static final String PAYMENTS_OPERATOR = "payments-operator";
    public static final String AUDITOR = "auditor";

    // Segregacion de funciones (four-eyes) del maker-checker de PAY_CONFLICT (tanda-9 B): quien SOLICITA reconocer
    // (maker) y quien APRUEBA (checker) son roles DISTINTOS, no solo actores distintos. Solo aplican cuando
    // mt101.pay.conflict.acknowledge.maker-checker.enabled=true (prod bancaria). El acknowledge single-actor
    // (maker-checker OFF) sigue con los roles operativos generales.
    public static final String PAY_CONFLICT_MAKER = "pay-conflict-maker";
    public static final String PAY_CONFLICT_CHECKER = "pay-conflict-checker";

    private PlatformRoles() {
    }
}
