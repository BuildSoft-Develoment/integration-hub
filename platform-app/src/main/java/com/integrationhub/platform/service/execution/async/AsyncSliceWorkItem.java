package com.integrationhub.platform.service.execution.async;

import java.util.List;
import java.util.Map;

/**
 * Payload de un work-item de <b>slice</b> del scatter-gather (ADR-015, Opción B). Es lo que viaja en
 * {@code AsyncTaskEnvelope.payload()} cuando una tarea batch/per-record async se reparte en N slices:
 * la configuración resuelta + el sub-lote de records de esta slice + su posición en el scatter.
 *
 * <p>El consumer reconstruye {@code List<ReadRecord>} desde {@code records} y ejecuta el
 * {@code BatchTaskProvider} para esta slice; el {@code sliceIndex}/{@code totalSlices} son para
 * trazabilidad (la agregación N→1 vive en {@code task_async_dispatch}, por {@code (peId, tdId)}).</p>
 *
 * @param configuration configuración resuelta de la tarea
 * @param records       valores de los records de esta slice (cada uno el {@code values()} de un ReadRecord)
 * @param sliceIndex    índice 0-based de la slice
 * @param totalSlices   total de slices del scatter
 */
public record AsyncSliceWorkItem(
        Map<String, Object> configuration,
        List<Map<String, Object>> records,
        int sliceIndex,
        int totalSlices) {
}
