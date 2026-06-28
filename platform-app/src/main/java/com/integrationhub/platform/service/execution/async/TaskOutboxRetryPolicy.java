package com.integrationhub.platform.service.execution.async;

/**
 * Politica de reintento/backoff del outbox de despacho de tareas (ADR-015),
 * espejo de la del relay de auditoria: backoff exponencial con tope, y un numero
 * maximo de intentos antes de mandar el work-item a dead-letter.
 *
 * <p>Logica pura para ser unit-testable sin DB ni broker.</p>
 */
public final class TaskOutboxRetryPolicy {

    private final int maxAttempts;
    private final long backoffBaseMs;
    private final long backoffMaxMs;

    public TaskOutboxRetryPolicy(int maxAttempts, long backoffBaseMs, long backoffMaxMs) {
        this.maxAttempts = maxAttempts;
        this.backoffBaseMs = backoffBaseMs;
        this.backoffMaxMs = backoffMaxMs;
    }

    /** Defaults alineados con el relay de auditoria (max 20, base 1s, tope 300s). */
    public static TaskOutboxRetryPolicy defaults() {
        return new TaskOutboxRetryPolicy(20, 1000L, 300_000L);
    }

    /** Hay reintento mientras el proximo intento no supere el maximo. */
    public boolean shouldRetry(int nextAttempt) {
        return nextAttempt <= maxAttempts;
    }

    /** Backoff exponencial {@code base * 2^(attempt-1)} con tope, sin overflow. */
    public long backoffMillis(int nextAttempt) {
        if (nextAttempt <= 1) {
            return Math.min(backoffBaseMs, backoffMaxMs);
        }
        int shift = nextAttempt - 1;
        if (shift >= 40) {
            return backoffMaxMs;
        }
        long backoff = backoffBaseMs << shift;
        return (backoff <= 0 || backoff > backoffMaxMs) ? backoffMaxMs : backoff;
    }
}
