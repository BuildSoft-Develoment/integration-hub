package com.integrationhub.platform.spi.task.payments;

/**
 * Resultado del despacho de un mensaje al gateway via {@link PaymentMessageTransport}.
 *
 * <p><b>Cuatro clasificaciones EXCLUYENTES</b> (D.2 — distinguir rechazo de negocio de fallo técnico):</p>
 * <ul>
 *   <li>{@code accepted}: el gateway/banco recibió y aceptó el mensaje.</li>
 *   <li>{@code uncertain}: fallo DURANTE/DESPUÉS del despacho (el archivo pudo llegar); nunca reenviar a ciegas,
 *       se resuelve consultando STATUS.</li>
 *   <li>{@code retriable}: fallo de TRANSPORTE/AUTENTICACIÓN <b>antes</b> del despacho (connect/auth/stat) → el banco
 *       <b>no</b> recibió nada. Es un fallo técnico, NO un rechazo del banco: es re-solicitable (arreglar la
 *       credencial/conexión y volver a solicitar). Mapea a {@code INVALIDATED} en el ciclo de pago, no a
 *       {@code FAILED}. Sin esto, un fallo de credencial dejaba el correctivo en {@code FAILED} terminal sin salida.</li>
 *   <li><b>rejected de negocio</b> (las tres banderas en false): el banco/gateway MIRÓ el mensaje y dijo que no
 *       (p.ej. duplicado con distinto hash, política FAIL, 4xx de negocio). Terminal: NO se reintenta a ciegas.</li>
 * </ul>
 *
 * @trace spec 008-mensajeria-pagos RF-004, RF-016, RF-017, T-009
 * @trace ADR-009
 */
public record TransportResult(
        boolean accepted,
        boolean uncertain,
        boolean retriable,
        String gatewayReference,
        int attempts,
        long durationMs,
        String lastError
) {

    public static TransportResult accepted(String gatewayReference, int attempts, long durationMs) {
        return new TransportResult(true, false, false, gatewayReference, attempts, durationMs, null);
    }

    /** Rechazo de NEGOCIO del banco: terminal, no re-solicitable a ciegas. */
    public static TransportResult rejected(int attempts, long durationMs, String lastError) {
        return new TransportResult(false, false, false, null, attempts, durationMs, lastError);
    }

    /** Resultado INCIERTO: pudo llegar al gateway pero no hubo confirmacion clara. */
    public static TransportResult uncertain(int attempts, long durationMs, String reason) {
        return new TransportResult(false, true, false, null, attempts, durationMs, reason);
    }

    /**
     * Fallo de TRANSPORTE/AUTENTICACIÓN antes del despacho (el banco no recibió nada): re-solicitable.
     * Se distingue de {@link #rejected} para no cerrar un correctivo en FAILED terminal por un problema técnico.
     */
    public static TransportResult transportFailure(int attempts, long durationMs, String reason) {
        return new TransportResult(false, false, true, null, attempts, durationMs, reason);
    }

    /** true sólo si es un rechazo de NEGOCIO del banco (ninguna otra clasificación aplica). */
    public boolean bankRejected() {
        return !accepted && !uncertain && !retriable;
    }
}
