package com.integrationhub.platform.api.response.payments;

/**
 * ADR-020 (A): una causa de fallo agregada en la cuarentena de un set. Convierte miles de filas en un
 * puñado de decisiones — cuantas filas comparten la misma regla y el rango de filas del archivo afectado.
 */
public record Mt101RuleSummaryResponse(
        String ruleCode,
        String ruleSet,
        String severity,
        long count,
        Long minSourceRecordNumber,
        Long maxSourceRecordNumber) {
}
