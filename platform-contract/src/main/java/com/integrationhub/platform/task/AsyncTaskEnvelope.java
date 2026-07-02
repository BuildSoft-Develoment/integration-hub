package com.integrationhub.platform.task;

import java.util.Map;

/**
 * Work-item de una tarea despachada de forma asincrona por broker (ADR-015).
 *
 * <p>Es el artefacto serializado que cruza el broker hacia un consumer que ejecuta
 * la tarea y reanuda el proceso. El mismo contrato compartido lo reutilizan los
 * plugins out-of-process (ADR-014): un plugin es un consumer de este envelope al
 * otro lado del transporte.</p>
 *
 * <p>Vive en {@code platform-contract} para que el motor y los autores de
 * consumidores/plugins dependan del mismo artefacto versionado, igual que
 * {@code AuditEnvelope}.</p>
 *
 * @param traceId          correlacion del proceso ({@code exec-<processExecutionId>})
 * @param processExecutionId identificador de la ejecucion del proceso
 * @param taskDefinitionId identificador de la tarea
 * @param taskType         tipo de tarea ({@code DB_WRITE}, {@code REST_CALL}, {@code MT101_PAY}, ...)
 * @param transport        broker destino ({@code KAFKA} por defecto)
 * @param idempotencyKey   clave determinista para descartar duplicados (at-least-once)
 * @param attempt          numero de intento (1-based)
 * @param payload          JSON de la slice de trabajo + configuracion resuelta
 * @param headers          metadata de transporte (traceId, recordId, ...)
 */
public record AsyncTaskEnvelope(
        String traceId,
        long processExecutionId,
        long taskDefinitionId,
        String taskType,
        String transport,
        String idempotencyKey,
        int attempt,
        String payload,
        Map<String, String> headers) {

    public AsyncTaskEnvelope {
        headers = headers == null ? Map.of() : Map.copyOf(headers);
    }
}
