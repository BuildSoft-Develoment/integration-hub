package com.integrationhub.platform.service.process;

// @trace spec 006-programacion-procesos RF-003 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.api.mapper.process.ProcessDefinitionApiMapper;
import com.integrationhub.platform.api.response.process.ProcessScheduleResponse;
import com.integrationhub.platform.repository.ProcessDefinitionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class ProcessScheduleQueryService {

    private final ProcessDefinitionRepository processDefinitionRepository;
    private final ProcessDefinitionApiMapper processDefinitionApiMapper;

    public ProcessScheduleQueryService(ProcessDefinitionRepository processDefinitionRepository,
                                       ProcessDefinitionApiMapper processDefinitionApiMapper) {
        this.processDefinitionRepository = processDefinitionRepository;
        this.processDefinitionApiMapper = processDefinitionApiMapper;
    }

    @Transactional
    public List<ProcessScheduleResponse> listScheduled() {
        return processDefinitionRepository.listScheduled().stream()
                .map(processDefinitionApiMapper::toScheduleResponse)
                .toList();
    }
}
