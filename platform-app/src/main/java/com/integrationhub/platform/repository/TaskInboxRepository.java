package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.TaskInbox;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

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
}
