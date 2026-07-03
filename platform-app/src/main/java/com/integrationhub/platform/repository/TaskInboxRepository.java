package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.TaskInbox;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;

/**
 * Acceso a datos del ledger de idempotencia del consumer de tareas (ADR-015), en el mismo estilo que
 * {@link TaskDispatchOutboxRepository}. Solo conoce la entidad y la persistencia (SRP): la traducción
 * dominio↔fila y las transacciones viven en el adaptador del puerto ({@code JpaTaskInboxStore}).
 */
@ApplicationScoped
public class TaskInboxRepository implements PanacheRepository<TaskInbox> {

    public boolean existsByIdempotencyKey(String idempotencyKey) {
        return idempotencyKey != null && count("idempotencyKey", idempotencyKey) > 0;
    }

    /**
     * Inserta un registro terminal de forma <b>idempotente</b> ({@code ON CONFLICT DO NOTHING}),
     * igual que {@code AuditEventWriter}. Race-safe por diseño: si otro consumer ya asentó la misma
     * clave, la fila se descarta sin excepción (el efecto quedó una sola vez). Las tramas POISON
     * ({@code idempotencyKey == null}) no entran al índice parcial → siempre se insertan.
     */
    public void insertIfAbsent(String idempotencyKey, String taskType, Long processExecutionId,
                               Long taskDefinitionId, String status, String outputsJson, String details,
                               String error, String rawPayload, String brokerType, String topic) {
        getEntityManager().createNativeQuery("""
                insert into task_inbox
                    (idempotency_key, task_type, process_execution_id, task_definition_id, status,
                     outputs_json, details, error, raw_payload, broker_type, topic, created_at)
                values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, current_timestamp)
                on conflict (idempotency_key) where idempotency_key is not null do nothing
                """)
                .setParameter(1, idempotencyKey)
                .setParameter(2, taskType)
                .setParameter(3, processExecutionId)
                .setParameter(4, taskDefinitionId)
                .setParameter(5, status)
                .setParameter(6, outputsJson)
                .setParameter(7, details)
                .setParameter(8, error)
                .setParameter(9, rawPayload)
                .setParameter(10, brokerType)
                .setParameter(11, topic)
                .executeUpdate();
    }

    /**
     * Retención (ADR-015): borra en lotes los registros de éxito/negocio ({@code PROCESSED},
     * {@code FAILED}) más viejos que el corte. Son el grueso del volumen (una fila por work-item
     * procesado) y son transitorios (dedup ya consumido), así que borrarlos evita el crecimiento
     * ilimitado del ledger a 1M+.
     */
    @Transactional
    public long cleanupProcessedOlderThan(LocalDateTime cutoff, int limit) {
        return deleteByStatusesOlderThan(cutoff, limit, TaskInbox.PROCESSED, TaskInbox.FAILED);
    }

    /** Retención del DLQ del inbox: borra {@code DEAD}/{@code POISON} muy viejos (forense acotado). */
    @Transactional
    public long cleanupDeadOlderThan(LocalDateTime cutoff, int limit) {
        return deleteByStatusesOlderThan(cutoff, limit, TaskInbox.DEAD, TaskInbox.POISON);
    }

    private long deleteByStatusesOlderThan(LocalDateTime cutoff, int limit, String statusA, String statusB) {
        var sql = "delete from task_inbox where id in ("
                + "select id from task_inbox where status in (?1, ?2) and created_at < ?3 "
                + "order by created_at asc limit ?4)";
        return getEntityManager().createNativeQuery(sql)
                .setParameter(1, statusA)
                .setParameter(2, statusB)
                .setParameter(3, Timestamp.valueOf(cutoff))
                .setParameter(4, Math.max(limit, 1))
                .executeUpdate();
    }
}
