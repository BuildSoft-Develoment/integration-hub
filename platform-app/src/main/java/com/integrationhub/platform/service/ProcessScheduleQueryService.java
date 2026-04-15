package com.integrationhub.platform.service;

import com.integrationhub.platform.api.dto.ProcessScheduleView;
import com.integrationhub.platform.repository.ProcessDefinitionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class ProcessScheduleQueryService {

    private final ProcessDefinitionRepository processDefinitionRepository;

    public ProcessScheduleQueryService(ProcessDefinitionRepository processDefinitionRepository) {
        this.processDefinitionRepository = processDefinitionRepository;
    }

    @Transactional
    public List<ProcessScheduleView> listScheduled() {
        return processDefinitionRepository.listScheduled().stream()
                .map(definition -> new ProcessScheduleView(
                        definition.id,
                        definition.name,
                        definition.description,
                        definition.active,
                        definition.scheduled,
                        definition.scheduleEvery,
                        definition.nextRunAt,
                        definition.lastRunAt
                ))
                .toList();
    }
}