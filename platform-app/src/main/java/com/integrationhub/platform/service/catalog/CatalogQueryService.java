package com.integrationhub.platform.service.catalog;

import com.integrationhub.platform.api.mapper.process.ProcessDefinitionApiMapper;
import com.integrationhub.platform.api.response.common.PageResponse;
import com.integrationhub.platform.api.response.process.ProcessDefinitionResponse;
import com.integrationhub.platform.api.response.process.ProcessScheduleResponse;
import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.entity.ConnectionDefinition;
import com.integrationhub.platform.entity.ReaderDefinition;
import com.integrationhub.platform.entity.SourceDefinition;
import com.integrationhub.platform.repository.ConnectionDefinitionRepository;
import com.integrationhub.platform.repository.ProcessDefinitionRepository;
import com.integrationhub.platform.repository.ReaderDefinitionRepository;
import com.integrationhub.platform.repository.SourceDefinitionRepository;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.HashMap;
import java.util.List;

@ApplicationScoped
public class CatalogQueryService {

    private final SourceDefinitionRepository sourceDefinitionRepository;
    private final ReaderDefinitionRepository readerDefinitionRepository;
    private final ConnectionDefinitionRepository connectionDefinitionRepository;
    private final ProcessDefinitionRepository processDefinitionRepository;
    private final ProcessDefinitionApiMapper processDefinitionApiMapper;

    public CatalogQueryService(SourceDefinitionRepository sourceDefinitionRepository,
                               ReaderDefinitionRepository readerDefinitionRepository,
                               ConnectionDefinitionRepository connectionDefinitionRepository,
                               ProcessDefinitionRepository processDefinitionRepository,
                               ProcessDefinitionApiMapper processDefinitionApiMapper) {
        this.sourceDefinitionRepository = sourceDefinitionRepository;
        this.readerDefinitionRepository = readerDefinitionRepository;
        this.connectionDefinitionRepository = connectionDefinitionRepository;
        this.processDefinitionRepository = processDefinitionRepository;
        this.processDefinitionApiMapper = processDefinitionApiMapper;
    }

    @Transactional
    public PageResponse<SourceDefinition> listSources(String queryText, String sourceType, String status, String direction, int page, int size) {
        var query = new StringBuilder("from SourceDefinition e where 1=1");
        var parameters = new HashMap<String, Object>();

        applyCatalogSearch(query, parameters, queryText, List.of("lower(e.name) like :queryText"));
        if (sourceType != null && !sourceType.isBlank()) {
            query.append(" and e.sourceType = :sourceType");
            parameters.put("sourceType", sourceType.trim().toUpperCase(java.util.Locale.ROOT));
        }
        // ADR-016: filtro por direccion (INPUT/OUTPUT/BOTH); ALL/blank no filtra.
        if (direction != null && !direction.isBlank() && !"ALL".equalsIgnoreCase(direction)) {
            query.append(" and e.direction = :direction");
            parameters.put("direction", direction.trim().toUpperCase(java.util.Locale.ROOT));
        }
        applyActiveStatus(query, parameters, status);
        query.append(" order by e.name");

        return pageResponse(sourceDefinitionRepository.find(query.toString(), parameters), page, size);
    }

    @Transactional
    public PageResponse<ReaderDefinition> listReaders(String queryText, String readerType, String status, int page, int size) {
        var query = new StringBuilder("from ReaderDefinition e where 1=1");
        var parameters = new HashMap<String, Object>();

        applyCatalogSearch(query, parameters, queryText, List.of("lower(e.name) like :queryText"));
        if (readerType != null && !readerType.isBlank()) {
            query.append(" and e.readerType = :readerType");
            parameters.put("readerType", readerType.trim().toUpperCase(java.util.Locale.ROOT));
        }
        applyActiveStatus(query, parameters, status);
        query.append(" order by e.name");

        return pageResponse(readerDefinitionRepository.find(query.toString(), parameters), page, size);
    }

    @Transactional
    public PageResponse<ConnectionDefinition> listConnections(String queryText, String connectionType, String status, int page, int size) {
        var query = new StringBuilder("from ConnectionDefinition e where 1=1");
        var parameters = new HashMap<String, Object>();

        applyCatalogSearch(query, parameters, queryText, List.of("lower(e.name) like :queryText"));
        if (connectionType != null && !connectionType.isBlank()) {
            query.append(" and e.connectionType = :connectionType");
            parameters.put("connectionType", ConnectionType.valueOf(connectionType.trim().toUpperCase()));
        }
        applyActiveStatus(query, parameters, status);
        query.append(" order by e.name");

        return pageResponse(connectionDefinitionRepository.find(query.toString(), parameters), page, size);
    }

    @Transactional
    public PageResponse<ProcessDefinitionResponse> listProcesses(String queryText, String mode, String status, int page, int size) {
        var query = new StringBuilder("from ProcessDefinition e where 1=1");
        var parameters = new HashMap<String, Object>();

        applyCatalogSearch(
                query,
                parameters,
                queryText,
                List.of(
                        "lower(e.name) like :queryText",
                        "lower(coalesce(e.description, '')) like :queryText"
                )
        );
        applyScheduledMode(query, parameters, mode);
        applyActiveStatus(query, parameters, status);
        query.append(" order by e.name");

        var result = processDefinitionRepository.find(query.toString(), parameters);
        var total = result.count();
        result.page(page, size);
        return new PageResponse<>(total, result.list().stream().map(processDefinitionApiMapper::toResponse).toList());
    }

    @Transactional
    public PageResponse<ProcessScheduleResponse> listSchedules(String queryText, String mode, String status, int page, int size) {
        var processes = listProcesses(queryText, mode, status, page, size);
        return new PageResponse<>(
                processes.total(),
                processes.items().stream().map(processDefinitionApiMapper::toScheduleResponse).toList()
        );
    }

    private <T> PageResponse<T> pageResponse(PanacheQuery<T> query, int page, int size) {
        var total = query.count();
        query.page(page, size);
        return new PageResponse<>(total, query.list());
    }

    private void applyCatalogSearch(StringBuilder query, HashMap<String, Object> parameters, String queryText, List<String> clauses) {
        if (queryText == null || queryText.isBlank()) {
            return;
        }

        var normalized = queryText.trim().toLowerCase();
        var conditions = new StringBuilder();
        for (var clause : clauses) {
            if (!conditions.isEmpty()) {
                conditions.append(" or ");
            }
            conditions.append(clause);
        }
        parameters.put("queryText", "%" + normalized + "%");

        if (normalized.chars().allMatch(Character::isDigit)) {
            conditions.append(" or e.id = :searchId");
            parameters.put("searchId", Long.valueOf(normalized));
        }

        query.append(" and (").append(conditions).append(")");
    }

    private void applyActiveStatus(StringBuilder query, HashMap<String, Object> parameters, String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return;
        }

        query.append(" and e.active = :active");
        parameters.put("active", "ACTIVE".equalsIgnoreCase(status));
    }

    private void applyScheduledMode(StringBuilder query, HashMap<String, Object> parameters, String mode) {
        if (mode == null || mode.isBlank() || "ALL".equalsIgnoreCase(mode)) {
            return;
        }

        query.append(" and e.scheduled = :scheduled");
        parameters.put("scheduled", "SCHEDULED".equalsIgnoreCase(mode));
    }
}
