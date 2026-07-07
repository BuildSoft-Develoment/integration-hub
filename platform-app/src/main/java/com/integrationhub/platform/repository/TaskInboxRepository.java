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
     * §5: ¿la clave ya está en un estado <b>terminal</b> (PROCESSED/FAILED/DEAD)? Es el pre-check de dedup
     * del consumer: a diferencia de {@link #existsByIdempotencyKey}, NO cuenta una fila {@code CLAIMED} como
     * hecha — un claim vivo/estancado debe ir al {@code claim()} (re-toma si el lease venció), no cortocircuitar.
     */
    public boolean existsTerminalByIdempotencyKey(String idempotencyKey) {
        return idempotencyKey != null
                && count("idempotencyKey = ?1 and status in (?2, ?3, ?4)",
                        idempotencyKey, TaskInbox.PROCESSED, TaskInbox.FAILED, TaskInbox.DEAD) > 0;
    }

    /**
     * §5: claim ATÓMICO del work-item once antes de ejecutar el efecto. Inserta la fila {@code CLAIMED} con
     * owner+lease; si ya existe, la re-toma <b>solo</b> si sigue {@code CLAIMED} y (es de este mismo owner
     * —retry in-app— o su lease venció —nodo caído—). Devuelve las filas afectadas: {@code 1} = este consumer
     * gana y debe ejecutar; {@code 0} = otro la tiene viva o ya es terminal → skip. Un solo UPDATE atómico
     * (mismo espíritu que el claim de process_execution, v53-fix #8), sin read-then-write racy.
     */
    public int claim(String idempotencyKey, String taskType, Long processExecutionId, Long taskDefinitionId,
                     String brokerType, String owner, Timestamp claimedUntil, Timestamp now) {
        return getEntityManager().createNativeQuery("""
                insert into task_inbox
                    (idempotency_key, task_type, process_execution_id, task_definition_id, status,
                     inbox_owner, claimed_until, broker_type, created_at)
                values (?1, ?2, ?3, ?4, 'CLAIMED', ?5, ?6, ?7, current_timestamp)
                on conflict (idempotency_key) where idempotency_key is not null do update
                    set status = 'CLAIMED', inbox_owner = excluded.inbox_owner,
                        claimed_until = excluded.claimed_until
                    where task_inbox.status = 'CLAIMED'
                      and (task_inbox.inbox_owner = excluded.inbox_owner or task_inbox.claimed_until < ?8)
                """)
                .setParameter(1, idempotencyKey)
                .setParameter(2, taskType)
                .setParameter(3, processExecutionId)
                .setParameter(4, taskDefinitionId)
                .setParameter(5, owner)
                .setParameter(6, claimedUntil)
                .setParameter(7, brokerType)
                .setParameter(8, now)
                .executeUpdate();
    }

    /**
     * §5: transiciona la fila {@code CLAIMED} de este work-item a su estado terminal tras ejecutar. FENCING: solo
     * finaliza si la fila la posee {@code owner} (el mismo nodo que reclamó). Un nodo con el lease vencido, cuya
     * fila re-reclamó otro, NO puede finalizarla (owner distinto → 0 filas → el caller cae a {@code insertIfAbsent},
     * que tampoco pisa la fila viva). Devuelve {@code 1} si finalizó su claim; {@code 0} si no era suyo/no había.
     */
    public int finalizeClaimed(String idempotencyKey, String status, String outputsJson,
                               String details, String error, String owner) {
        return getEntityManager().createNativeQuery("""
                update task_inbox
                   set status = ?2, outputs_json = ?3, details = ?4, error = ?5,
                       inbox_owner = null, claimed_until = null
                 where idempotency_key = ?1 and status = 'CLAIMED' and inbox_owner = ?6
                """)
                .setParameter(1, idempotencyKey)
                .setParameter(2, status)
                .setParameter(3, outputsJson)
                .setParameter(4, details)
                .setParameter(5, error)
                .setParameter(6, owner)
                .executeUpdate();
    }

    /**
     * §5 recovery (fail-safe): marca {@code DEAD} los claims con lease vencido más allá del corte (nodo caído
     * que no finalizó). NO re-ejecuta a ciegas (regla de seguridad del claim distribuido): el efecto pudo haber
     * corrido, así que se deja visible en la consola DLQ para que ops lo redrive con criterio. Devuelve el conteo.
     */
    @Transactional
    public int markExpiredClaimsDead(Timestamp cutoff, String error) {
        return getEntityManager().createNativeQuery("""
                update task_inbox
                   set status = 'DEAD', error = ?2, inbox_owner = null, claimed_until = null
                 where status = 'CLAIMED' and claimed_until < ?1
                """)
                .setParameter(1, cutoff)
                .setParameter(2, error)
                .executeUpdate();
    }

    /** Conteo por estado, para métricas de operabilidad (procesados, fallos, DLQ). */
    public long countByStatus(String status) {
        return count("status", status);
    }

    /**
     * Filas terminadas mal ({@code DEAD}/{@code POISON}), más recientes primero, para la consola de DLQ.
     */
    public java.util.List<com.integrationhub.platform.entity.TaskInbox> findDead(int limit) {
        return find("status in ?1 order by id desc",
                java.util.List.of(com.integrationhub.platform.entity.TaskInbox.DEAD,
                        com.integrationhub.platform.entity.TaskInbox.POISON))
                .page(0, Math.max(1, limit))
                .list();
    }

    /**
     * Borra el registro de dedup de una clave (redrive de un {@code DEAD}): tras corregir la causa
     * raíz (tipo/config), quitar la fila libera la idempotencyKey para que un re-encolado se procese.
     */
    public long deleteByIdempotencyKey(String idempotencyKey) {
        return idempotencyKey == null ? 0 : delete("idempotencyKey", idempotencyKey);
    }

    /**
     * Inserta un registro terminal de forma <b>idempotente</b> ({@code ON CONFLICT DO NOTHING}),
     * igual que {@code AuditEventWriter}. Race-safe por diseño: si otro consumer ya asentó la misma
     * clave, la fila se descarta sin excepción (el efecto quedó una sola vez). Las tramas POISON
     * ({@code idempotencyKey == null}) no entran al índice parcial → siempre se insertan.
     */
    public long insertIfAbsent(String idempotencyKey, String taskType, Long processExecutionId,
                               Long taskDefinitionId, String status, String outputsJson, String details,
                               String error, String rawPayload, String brokerType, String topic) {
        return getEntityManager().createNativeQuery("""
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
