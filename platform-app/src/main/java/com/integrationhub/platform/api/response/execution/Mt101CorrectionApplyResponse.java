package com.integrationhub.platform.api.response.execution;

import java.util.List;

/**
 * ADR-020 (C3): resultado del apply de la planilla de correccion. Conteos por outcome
 * (corregidas / sin cambios / omitidas / fallidas), una muestra de las corregidas y la lista de FILAS
 * PROBLEMATICAS (omitidas + fallidas) — capada; {@code issuesTruncated} avisa si se corto (el conteo es
 * autoritativo, nada se pierde en silencio; el rastro completo esta en la auditoria por fila).
 */
public record Mt101CorrectionApplyResponse(
        int total,
        int corrected,
        int unchanged,
        int skipped,
        int failed,
        boolean issuesTruncated,
        List<Row> correctedSample,
        List<Row> issues) {

    /** Una fila del resultado: outcome CORRECTED / UNCHANGED / SKIPPED / FAILED (+ motivo si aplica). */
    public record Row(
            Long stagingId,
            Long recordNumber,
            String sendersReference,
            String outcome,
            String reason,
            List<String> changedFields) {
    }
}
