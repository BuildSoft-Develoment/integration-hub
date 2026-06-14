package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.AuditRecordEvent;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

/**
 * Lectura del store frio para el visor de trazabilidad E2E por registro.
 */
@ApplicationScoped
public class AuditRecordEventRepository implements PanacheRepository<AuditRecordEvent> {

    /** Linea de tiempo de un registro (:20:) ordenada por instante del evento. */
    public List<AuditRecordEvent> timelineByRecordId(String recordId, int limit) {
        return find("recordId = ?1 order by eventTs asc, id asc", recordId).page(0, limit).list();
    }

    /** Linea de tiempo de toda una ejecucion/ingesta (traceId). */
    public List<AuditRecordEvent> timelineByTraceId(String traceId, int limit) {
        return find("traceId = ?1 order by eventTs asc, id asc", traceId).page(0, limit).list();
    }
}
