package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.AuditEvent;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Map;

@ApplicationScoped
public class AuditEventRepository implements PanacheRepository<AuditEvent> {

    public PanacheQuery<AuditEvent> findAuditEvents(String query, Map<String, Object> parameters) {
        return find(query, parameters);
    }

    public PanacheQuery<AuditEvent> findRecent(int page, int size) {
        var query = find("from AuditEvent e order by e.id desc");
        query.page(page, size);
        return query;
    }

    public java.util.List<String> listEventTypes() {
        return getEntityManager()
                .createQuery("select distinct e.eventType from AuditEvent e order by e.eventType", String.class)
                .getResultList();
    }

    public String findLatestTaskPayload(Long processExecutionId, Long taskDefinitionId) {
        return find("from AuditEvent e where e.processExecution.id = ?1 and e.taskDefinition.id = ?2 and e.eventType in (?3) order by e.id desc",
                processExecutionId,
                taskDefinitionId,
                java.util.List.of("TASK_COMPLETED", "TASK_FAILED", "TASK_COMPLETED_WITH_ERRORS"))
                .firstResultOptional()
                .map(event -> event.payloadJson)
                .orElse(null);
    }
}
