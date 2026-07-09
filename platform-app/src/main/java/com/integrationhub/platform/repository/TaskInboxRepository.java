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
                     String brokerType, String owner, String claimToken, Timestamp claimedUntil, Timestamp now) {
        // #4 (fencing por token): re-toma un CLAIMED solo si es MI PROPIO claim (mismo inbox_claim_token — el retry
        // in-app de esta misma entrega) o su lease venció/liberado (nodo caído / release-on-failure). Una entrega
        // CONCURRENTE distinta trae otro token y, con el lease vivo, NO matchea → 0 filas → skip (no doble efecto).
        // Reemplaza al clause same-owner: la correctitud ya no depende de ordered=true/max-concurrency=1.
        return getEntityManager().createNativeQuery("""
                insert into task_inbox
                    (idempotency_key, task_type, process_execution_id, task_definition_id, status,
                     inbox_owner, inbox_claim_token, claimed_until, broker_type, created_at)
                values (?1, ?2, ?3, ?4, 'CLAIMED', ?5, ?6, ?7, ?8, current_timestamp)
                on conflict (idempotency_key) where idempotency_key is not null do update
                    set status = 'CLAIMED', inbox_owner = excluded.inbox_owner,
                        inbox_claim_token = excluded.inbox_claim_token,
                        claimed_until = excluded.claimed_until
                    where task_inbox.status = 'CLAIMED'
                      and (task_inbox.inbox_claim_token = excluded.inbox_claim_token
                           or task_inbox.claimed_until is null
                           or task_inbox.claimed_until < ?9)
                """)
                .setParameter(1, idempotencyKey)
                .setParameter(2, taskType)
                .setParameter(3, processExecutionId)
                .setParameter(4, taskDefinitionId)
                .setParameter(5, owner)
                .setParameter(6, claimToken)
                .setParameter(7, claimedUntil)
                .setParameter(8, brokerType)
                .setParameter(9, now)
                .executeUpdate();
    }

    /**
     * §5: transiciona la fila {@code CLAIMED} de este work-item a su estado terminal tras ejecutar. FENCING: solo
     * finaliza si la fila la posee {@code owner} (el mismo nodo que reclamó). Un nodo con el lease vencido, cuya
     * fila re-reclamó otro, NO puede finalizarla (owner distinto → 0 filas → el caller cae a {@code insertIfAbsent},
     * que tampoco pisa la fila viva). Devuelve {@code 1} si finalizó su claim; {@code 0} si no era suyo/no había.
     */
    public int finalizeClaimed(String idempotencyKey, String status, String outputsJson,
                               String details, String error, String claimToken) {
        // #4: FENCING por token — solo finaliza el claim EXACTO (mismo inbox_claim_token). Un claim re-tomado por otra
        // entrega (token distinto) o vencido NO puede ser finalizado por un intento tardío → 0 filas → el caller cae a
        // insertIfAbsent (que tampoco pisa la fila viva). Reemplaza el fencing por owner (que no distinguía re-tomas
        // del mismo owner).
        return getEntityManager().createNativeQuery("""
                update task_inbox
                   set status = ?2, outputs_json = ?3, details = ?4, error = ?5,
                       inbox_owner = null, inbox_claim_token = null, claimed_until = null
                 where idempotency_key = ?1 and status = 'CLAIMED' and inbox_claim_token = ?6
                """)
                .setParameter(1, idempotencyKey)
                .setParameter(2, status)
                .setParameter(3, outputsJson)
                .setParameter(4, details)
                .setParameter(5, error)
                .setParameter(6, claimToken)
                .executeUpdate();
    }

    /**
     * #4 (release-on-failure): libera el claim de ESTA entrega tras agotar los retries in-app, para que la re-entrega
     * del broker (nueva entrega, nuevo token) lo re-clame de inmediato en vez de esperar a que venza el lease (o peor,
     * que el barrido de recuperación lo marque DEAD como si el nodo hubiera caído). Owner-scoped por token: solo el
     * dueño del claim vivo lo libera. Deja la fila {@code CLAIMED} pero re-clamable (lease/owner/token limpios).
     */
    public int releaseClaim(String idempotencyKey, String claimToken) {
        return getEntityManager().createNativeQuery("""
                update task_inbox
                   set inbox_owner = null, inbox_claim_token = null, claimed_until = null
                 where idempotency_key = ?1 and status = 'CLAIMED' and inbox_claim_token = ?2
                """)
                .setParameter(1, idempotencyKey)
                .setParameter(2, claimToken)
                .executeUpdate();
    }

    /**
     * §5 (F3, heartbeat): extiende el lease de un claim VIVO mientras su efecto se ejecuta. Owner-scoped: solo el
     * dueño renueva. Devuelve {@code 1} si renovó; {@code 0} si ya no era suyo (otro nodo lo re-tomó) o ya no está
     * {@code CLAIMED} (finalizó): en ese caso el heartbeat deja de renovar. Mantener {@code claimed_until} adelantado
     * evita que una reentrega durante una ejecución larga (rebalance/redelivery) re-tome el claim y duplique el efecto.
     */
    public int renewLease(String idempotencyKey, String claimToken, Timestamp claimedUntil) {
        // #4: renueva solo si sigue siendo MI claim (mismo inbox_claim_token). Si otra entrega lo re-tomó (token
        // distinto) o ya finalizó, 0 filas → el heartbeat deja de renovar.
        return getEntityManager().createNativeQuery("""
                update task_inbox
                   set claimed_until = ?3
                 where idempotency_key = ?1 and status = 'CLAIMED' and inbox_claim_token = ?2
                """)
                .setParameter(1, idempotencyKey)
                .setParameter(2, claimToken)
                .setParameter(3, claimedUntil)
                .executeUpdate();
    }

    /**
     * §5 recovery (fail-safe): marca {@code DEAD} los claims con lease vencido más allá del corte (nodo caído
     * que no finalizó). NO re-ejecuta a ciegas (regla de seguridad del claim distribuido): el efecto pudo haber
     * corrido, así que se deja visible en la consola DLQ para que ops lo redrive con criterio. Devuelve el conteo.
     */
    @Transactional
    public int markExpiredClaimsDead(Timestamp cutoff, String error) {
        // #4 (A): también se limpia inbox_claim_token (como finalizeClaimed/releaseClaim), para no dejar un token
        // huérfano en una fila DEAD (higiene del DLQ; DEAD no es re-clamable, así que no abre doble ejecución).
        return getEntityManager().createNativeQuery("""
                update task_inbox
                   set status = 'DEAD', error = ?2, inbox_owner = null, inbox_claim_token = null, claimed_until = null
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
