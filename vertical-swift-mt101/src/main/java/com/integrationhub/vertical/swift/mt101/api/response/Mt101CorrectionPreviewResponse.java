package com.integrationhub.vertical.swift.mt101.api.response;

import java.util.List;

/**
 * ADR-020 (C2): resultado del dry-run del import de la planilla de correccion. Conteos globales + las columnas
 * editables detectadas + una muestra de las primeras filas clasificadas. No aplica nada (read-only).
 */
public record Mt101CorrectionPreviewResponse(
        int total,
        int toCorrect,
        int unchanged,
        int conflicts,
        List<String> editableColumns,
        List<Row> sample) {

    /** Clasificacion de una fila: TO_CORRECT / UNCHANGED / CONFLICT (con motivo) + campos que cambiarian. */
    public record Row(
            Long stagingId,
            Long recordNumber,
            String sendersReference,
            String outcome,
            String reason,
            List<String> changedFields) {
    }
}
