package com.integrationhub.platform.provider.task.payments.spi;

/**
 * Hallazgo producido por una validacion (NVR estructural u oficial).
 *
 * <p>Se emite por {@link ValidationPredicate}. El task provider acumula la lista y la
 * publica como output {@code errors} para tareas posteriores y como fila en
 * {@code mt101_validation_issue} cuando configura persistencia.</p>
 *
 * @param code identificador de la regla (no enumerado en spec; lo declara la propia regla).
 * @param ruleSet identificador del set al que pertenece (p.ej. {@code structural-mvp}).
 * @param severity severidad del hallazgo.
 * @param transactionReference referencia {@code :21:} de la transaccion afectada, o {@code null}
 *        si el hallazgo es a nivel de mensaje.
 * @param message detalle legible para operador.
 *
 * @trace spec 008-mensajeria-pagos RF-002, T-002
 * @trace ADR-009
 */
public record ValidationIssue(
        String code,
        String ruleSet,
        Severity severity,
        String transactionReference,
        String message
) {

    /** Severidad del issue; afecta la politica {@code failOn} del task validador. */
    public enum Severity {
        ERROR,
        WARNING,
        INFO;

        public boolean reaches(Severity threshold) {
            return ordinal() <= threshold.ordinal();
        }
    }

    public static ValidationIssue messageLevel(String code, String ruleSet, Severity severity, String message) {
        return new ValidationIssue(code, ruleSet, severity, null, message);
    }

    public static ValidationIssue transactionLevel(String code, String ruleSet, Severity severity,
                                                   String transactionReference, String message) {
        return new ValidationIssue(code, ruleSet, severity, transactionReference, message);
    }
}
