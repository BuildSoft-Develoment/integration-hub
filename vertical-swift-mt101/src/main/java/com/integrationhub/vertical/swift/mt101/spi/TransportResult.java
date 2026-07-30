package com.integrationhub.vertical.swift.mt101.spi;

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
        String lastError,
        ReasonCode reasonCode
) {

    public static TransportResult accepted(String gatewayReference, int attempts, long durationMs) {
        return new TransportResult(true, false, false, gatewayReference, attempts, durationMs, null,
                ReasonCode.NONE);
    }

    /**
     * Causa TIPADA del resultado. Existe para que el provider discrimine por TIPO y no por el texto de
     * {@code lastError}: clasificar dinero por sniffing de mensajes es fragil y el propio SftpPaymentTransport
     * lo prohibe explicitamente.
     */
    public enum ReasonCode {
        /** Sin causa distinguible; comportamiento historico. */
        NONE,
        /**
         * NO se despacho NADA en esta corrida: el destino remoto YA contenia bytes que no son los nuestros.
         * El banco nunca miro este mensaje. Se clasifica {@code rejected} -terminal, invisible para el
         * auto-cierre de UNCERTAIN, y con ruta de reproceso auditada- y ademas se marca {@code pay_conflict},
         * porque la etiqueta del estado dice "rechazado" pero el hecho real es "no entregado, destino ocupado".
         */
        REMOTE_PRE_EXISTING
    }

    /** Rechazo de NEGOCIO del banco: terminal, no re-solicitable a ciegas. */
    public static TransportResult rejected(int attempts, long durationMs, String lastError) {
        return rejected(attempts, durationMs, lastError, ReasonCode.NONE);
    }

    public static TransportResult rejected(int attempts, long durationMs, String lastError, ReasonCode reasonCode) {
        return new TransportResult(false, false, false, null, attempts, durationMs, lastError, reasonCode);
    }

    /** Resultado INCIERTO: pudo llegar al gateway pero no hubo confirmacion clara. */
    public static TransportResult uncertain(int attempts, long durationMs, String reason) {
        return new TransportResult(false, true, false, null, attempts, durationMs, reason, ReasonCode.NONE);
    }

    /**
     * Incierto que SI trae la referencia del gateway: el banco respondio 2xx y acuso el pago, pero la prueba de
     * aceptacion declarada no fue concluyente.
     *
     * <p>La referencia se conserva a proposito. El cierre automatico de un UNCERTAIN correlaciona UNICAMENTE por
     * {@code ${sendersReference}} -{@code mt101_build_fragment} no persiste ni gatewayReference ni
     * idempotencyKey-, asi que tirar el acuse que el banco acaba de darnos deja el caso resoluble solo por
     * referencia. Persistirlo es lo unico que abre la puerta a cerrarlo algun dia por IDENTIDAD.</p>
     */
    public static TransportResult uncertain(String gatewayReference, int attempts, long durationMs, String reason) {
        return new TransportResult(false, true, false, gatewayReference, attempts, durationMs, reason,
                ReasonCode.NONE);
    }

    /**
     * Fallo de TRANSPORTE/AUTENTICACIÓN antes del despacho (el banco no recibió nada): re-solicitable.
     * Se distingue de {@link #rejected} para no cerrar un correctivo en FAILED terminal por un problema técnico.
     */
    public static TransportResult transportFailure(int attempts, long durationMs, String reason) {
        return new TransportResult(false, false, true, null, attempts, durationMs, reason, ReasonCode.NONE);
    }

    /** true sólo si es un rechazo de NEGOCIO del banco (ninguna otra clasificación aplica). */
    public boolean bankRejected() {
        return !accepted && !uncertain && !retriable;
    }
}
