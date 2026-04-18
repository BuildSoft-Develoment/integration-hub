package com.integrationhub.platform.repository;

import com.integrationhub.platform.domain.ExecutionStatus;
import com.integrationhub.platform.entity.ProcessExecution;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Map;
import java.util.List;

@ApplicationScoped
public class ProcessExecutionRepository implements PanacheRepository<ProcessExecution> {

    public long countByTriggerSource(String triggerSource) {
        return count("triggerSource", triggerSource);
    }

    public ProcessExecution findRequired(Long id) {
        var execution = findById(id);
        if (execution == null) {
            throw new IllegalArgumentException("Execution not found: " + id);
        }
        return execution;
    }

    public PanacheQuery<ProcessExecution> findExecutions(String query, Map<String, Object> parameters) {
        return find(query, parameters);
    }

    public PanacheQuery<ProcessExecution> findRecent(int page, int size) {
        var query = find("from ProcessExecution e order by e.id desc");
        query.page(page, size);
        return query;
    }

    public PanacheQuery<ProcessExecution> findRecentFailed(int page, int size) {
        var query = find("from ProcessExecution e where e.status in ?1 order by e.id desc", java.util.List.of(ExecutionStatus.FAILED, ExecutionStatus.COMPLETED_WITH_ERRORS));
        query.page(page, size);
        return query;
    }

    public PanacheQuery<ProcessExecution> findChildrenBySourceExecutionId(Long sourceExecutionId) {
        return find("from ProcessExecution e where e.sourceExecutionId = ?1 order by e.id desc", sourceExecutionId);
    }

    public long countPendingExecutions() {
        return count("status", ExecutionStatus.PENDING);
    }

    public List<ProcessExecution> listPendingExecutions(int limit) {
        var query = find("from ProcessExecution e where e.status = ?1 order by e.id asc", ExecutionStatus.PENDING);
        query.page(0, Math.max(limit, 1));
        return query.list();
    }
}
