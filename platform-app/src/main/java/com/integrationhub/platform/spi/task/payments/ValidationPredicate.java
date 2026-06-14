package com.integrationhub.platform.spi.task.payments;


import java.util.List;

/**
 * SPI de regla de validacion ejecutable sobre un mensaje de pago.
 *
 * <p>Cada implementacion es un bean CDI {@link jakarta.enterprise.context.ApplicationScoped}.
 * El predicado se auto-describe via {@link #code()}, {@link #standard()},
 * {@link #appliesTo()}, {@link #severity()} y {@link #ruleSet()}; el motor de validacion
 * (ver {@code Mt101ValidateTaskProvider}) lo selecciona segun la configuracion del task.</p>
 *
 * <p><b>Convencion de nombres:</b> los codigos de reglas estructurales propias de la
 * plataforma usan prefijo {@code STRUCT.} (p.ej. {@code STRUCT.AMOUNT_POSITIVE}). Los
 * codigos NVR oficiales de SWIFT solo se cargan en deployments con licencia y por
 * fuera de este repositorio (ver ADR-009 y RF-011 spec 008).</p>
 *
 * @trace spec 008-mensajeria-pagos RF-002, RF-011, T-002
 * @trace ADR-009
 */
public interface ValidationPredicate {

    /** Codigo unico del predicado dentro de su {@link #ruleSet()}. */
    String code();

    /** Estandar al que aplica: {@code SWIFT}, {@code ISO20022}, {@code OPENBANKING}. */
    String standard();

    /** Tipo de mensaje al que aplica: {@code MT101}, {@code MT103}, {@code PAIN001}, etc. */
    String appliesTo();

    /** Severidad del hallazgo cuando el predicado dispara. */
    ValidationIssue.Severity severity();

    /** Identificador del set al que pertenece (p.ej. {@code structural-mvp}). */
    String ruleSet();

    /** Habilitado o no. Permite desactivar reglas sin removerlas. */
    default boolean active() {
        return true;
    }

    /**
     * Evalua el predicado sobre un mensaje. Retorna lista vacia si no hay hallazgos
     * (no usar {@code null}). Una sola invocacion puede producir 0..N issues
     * (p.ej. una regla de "monto positivo" emite un issue por cada transaccion mala).
     */
    List<ValidationIssue> evaluate(Mt101Message message);
}
