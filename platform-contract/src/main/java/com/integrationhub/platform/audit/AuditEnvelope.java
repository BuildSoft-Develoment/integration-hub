package com.integrationhub.platform.audit;

import java.time.Instant;
import java.util.Map;

/**
 * Trama de auditoria que viaja productor -> MQ -> consumidor. Es el contrato
 * compartido: el productor la emite (sin tocar la TX de negocio) y el consumidor
 * la registra (audit_event para PROCESS, store frio para RECORD).
 *
 * <p>Lleva la identidad de correlacion para trazabilidad E2E a nivel de registro:
 * {@code traceId} (ingesta/ejecucion) y {@code recordId} (fila origen). La clave
 * de particion en el broker es {@code traceId} para preservar orden por flujo.</p>
 *
 * @param eventId       UUID unico del evento (idempotencia: el consumidor dedup por aqui)
 * @param traceId       correlacion por ejecucion/archivo; null solo en eventos sin proceso
 * @param recordId      correlacion por registro (archivo + indice global); null en nivel PROCESS
 * @param level         PROCESS o RECORD
 * @param stage         etapa/tipo: PROCESS_STARTED, TASK_COMPLETED, RECORD_ARCHIVED, RECORD_SENT...
 * @param status        estado: RUNNING, COMPLETED, FAILED, REJECTED...
 * @param processExecutionId opcional, ancla al proceso (para poblar audit_event)
 * @param taskDefinitionId   opcional, ancla a la tarea
 * @param message       texto legible opcional
 * @param payloadJson   detalle serializado (JSON) opcional
 * @param attributes    metadatos planos opcionales (nunca null)
 * @param timestamp     instante del evento
 * @param schemaVersion version del esquema de la trama (evolucion independiente de consumidores)
 */
public record AuditEnvelope(
        String eventId,
        String traceId,
        String recordId,
        AuditLevel level,
        String stage,
        String status,
        Long processExecutionId,
        Long taskDefinitionId,
        String message,
        String payloadJson,
        Map<String, String> attributes,
        Instant timestamp,
        int schemaVersion) {

    public static final int CURRENT_SCHEMA_VERSION = 1;

    public AuditEnvelope {
        if (eventId == null || eventId.isBlank()) {
            throw new IllegalArgumentException("AuditEnvelope eventId cannot be blank");
        }
        if (level == null) {
            throw new IllegalArgumentException("AuditEnvelope level cannot be null");
        }
        if (stage == null || stage.isBlank()) {
            throw new IllegalArgumentException("AuditEnvelope stage cannot be blank");
        }
        attributes = attributes == null ? Map.of() : Map.copyOf(attributes);
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }
}
