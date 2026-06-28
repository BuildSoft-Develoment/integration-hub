package com.integrationhub.platform.service.execution.async;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Clave de idempotencia determinista para una unidad de trabajo de tarea async
 * (ADR-015). Como Kafka es at-least-once, el consumer usa esta clave para descartar
 * reintentos duplicados y no repetir el efecto (critico en DB_WRITE, REST y pagos).
 */
public final class TaskIdempotency {

    private TaskIdempotency() {
    }

    /**
     * Deriva la clave a partir de la identidad de la ejecucion, la tarea y un
     * discriminador de la slice/batch (p.ej. el hash del lote o el rango de filas).
     * Misma entrada -> misma clave; distinta slice -> distinta clave.
     */
    public static String key(long processExecutionId, long taskDefinitionId, String sliceDiscriminator) {
        var material = processExecutionId + ":" + taskDefinitionId + ":"
                + (sliceDiscriminator == null ? "" : sliceDiscriminator);
        return sha256Hex(material);
    }

    private static String sha256Hex(String value) {
        try {
            var digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            var hex = new StringBuilder(digest.length * 2);
            for (var b : digest) {
                hex.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
