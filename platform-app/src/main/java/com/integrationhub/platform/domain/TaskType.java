package com.integrationhub.platform.domain;

/**
 * Catalogo de tipos de tarea reconocidos por el motor.
 *
 * <p><b>Tipos base del motor</b> (spec 003-diseno-y-ejecucion-procesos):
 * {@link #FILE_READ}, {@link #DB_WRITE}, {@link #DB_EXECUTE_SP}, {@link #DB_EXECUTE_FN},
 * {@link #REST_CALL}, {@link #NOTIFICATION}.</p>
 *
 * <p><b>Tipos de verticales</b> (registrados aqui como puente temporal hasta el cierre
 * de M-1a {@code TaskTypeRegistry}; ver T-015 de spec 003 y ADR-009):</p>
 * <ul>
 *   <li>{@code MT101_*}: vertical mensajeria de pagos sub-catalogo {@code swift/},
 *       spec 008-mensajeria-pagos.</li>
 * </ul>
 *
 * <p><b>Deuda tecnica documentada</b>: este enum es cerrado por restriccion JPA
 * {@code @Enumerated(EnumType.STRING)} en {@code ProcessTaskDefinition.taskType}.
 * El cierre limpio de OCP es la tarea T-015 de spec 003 (M-1a): convertir este
 * enum en un {@code TaskTypeRegistry} con discovery via SPI, manteniendo este
 * archivo solo con los tipos del motor.</p>
 *
 * <p>Mientras tanto, agregar un valor MT101_* aqui no implica que el motor (003)
 * conozca semantica SWIFT: la logica de dominio vive en los
 * {@code TaskProvider} del modulo 008. Este enum solo expone un token de
 * registracion.</p>
 */
public enum TaskType {

    // --- Tipos base del motor (spec 003) ---
    FILE_READ,
    DB_WRITE,
    DB_EXECUTE_SP,
    DB_EXECUTE_FN,
    REST_CALL,
    NOTIFICATION,

    // --- Vertical mensajeria de pagos sub-catalogo swift/ (spec 008) ---
    // Puente temporal hasta M-1a (T-015 spec 003).
    // Sprint 1: BUILD, VALIDATE, ARCHIVE, PAY.
    // Sprint 2: ROUTE (T-017), RECONCILE (T-014). Mas en sprint 2.2/2.3.
    MT101_BUILD,
    MT101_VALIDATE,
    MT101_ARCHIVE,
    MT101_PAY,
    MT101_ROUTE,
    MT101_RECONCILE,
    MT101_STATUS,
    MT101_PARSE,
    MT101_SPLIT,
    MT101_REPAIR
}
