package com.integrationhub.platform.spi.staging;

import java.util.List;

/**
 * ADR-021 (decision 3): que cambio exactamente en una fila de staging, calculado por el motor.
 *
 * <p>Se archivan los <b>hashes</b> del payload antes y despues, no los payloads: alcanzan para probar
 * que la fila entregada es la que se aprobo, sin duplicar datos de pago en una segunda tabla.
 *
 * @param oldPayloadHash SHA-256 hex del payload previo (cadena vacia si era {@code null}).
 * @param newPayloadHash SHA-256 hex del payload resultante.
 * @param changedFields  claves de primer nivel cuyo valor cambio, en orden alfabetico.
 * @param oldVersion     version contra la que se aplico el UPDATE (la del If-Match, si vino).
 * @param newVersion     version resultante, siempre {@code oldVersion + 1}.
 */
public record StagingCorrectionEvidence(String oldPayloadHash,
                                        String newPayloadHash,
                                        List<String> changedFields,
                                        long oldVersion,
                                        long newVersion) {
}
