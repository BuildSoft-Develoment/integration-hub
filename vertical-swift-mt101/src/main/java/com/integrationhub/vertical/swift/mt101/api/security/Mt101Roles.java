package com.integrationhub.vertical.swift.mt101.api.security;

/**
 * Roles propios del vertical SWIFT MT101.
 *
 * <p>Segregacion de funciones (four-eyes) del maker-checker de PAY_CONFLICT (tanda-9 B): quien
 * SOLICITA reconocer (maker) y quien APRUEBA (checker) son roles DISTINTOS, no solo actores
 * distintos. Solo aplican cuando {@code mt101.pay.conflict.acknowledge.maker-checker.enabled=true}
 * (prod bancaria). El acknowledge single-actor (maker-checker OFF) sigue con los roles operativos
 * generales de {@code PlatformRoles}.</p>
 *
 * <p>ADR-021: estaban en {@code PlatformRoles} del motor, que nunca los uso — cero referencias
 * fuera de este vertical. Un vertical trae sus roles con el, como trae sus tipos de tarea.</p>
 */
public final class Mt101Roles {

    public static final String PAY_CONFLICT_MAKER = "pay-conflict-maker";
    public static final String PAY_CONFLICT_CHECKER = "pay-conflict-checker";

    private Mt101Roles() {
    }
}
