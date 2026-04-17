package com.integrationhub.platform.api.mapper.process;

import com.integrationhub.platform.api.response.process.DefinitionRefResponse;
import com.integrationhub.platform.api.response.process.ProcessDefinitionResponse;
import com.integrationhub.platform.api.response.process.ProcessScheduleResponse;
import com.integrationhub.platform.api.response.process.ProcessTaskDefinitionResponse;
import com.integrationhub.platform.entity.ProcessDefinition;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class ProcessDefinitionApiMapper {

    public ProcessDefinitionResponse toResponse(ProcessDefinition definition) {
        var tasks = definition.tasks == null
                ? List.<ProcessTaskDefinitionResponse>of()
                : definition.tasks.stream()
                .filter(task -> task.active)
                .sorted(java.util.Comparator.comparing(task -> task.taskOrder))
                .map(this::toTaskResponse)
                .toList();

        return new ProcessDefinitionResponse(
                definition.id,
                definition.name,
                definition.description,
                definition.active,
                definition.scheduled,
                definition.scheduleEvery,
                definition.nextRunAt,
                definition.lastRunAt,
                definition.flowLayoutJson,
                tasks
        );
    }

    public ProcessScheduleResponse toScheduleResponse(ProcessDefinition definition) {
        return new ProcessScheduleResponse(
                definition.id,
                definition.name,
                definition.description,
                definition.active,
                definition.scheduled,
                definition.scheduleEvery,
                definition.nextRunAt,
                definition.lastRunAt
        );
    }

    public ProcessScheduleResponse toScheduleResponse(ProcessDefinitionResponse definition) {
        return new ProcessScheduleResponse(
                definition.id(),
                definition.name(),
                definition.description(),
                definition.active(),
                definition.scheduled(),
                definition.scheduleEvery(),
                definition.nextRunAt(),
                definition.lastRunAt()
        );
    }

    private ProcessTaskDefinitionResponse toTaskResponse(ProcessTaskDefinition task) {
        return new ProcessTaskDefinitionResponse(
                task.id,
                task.taskOrder,
                task.taskType,
                task.active,
                task.configurationJson,
                task.sourceDefinition == null ? null : new DefinitionRefResponse(task.sourceDefinition.id, task.sourceDefinition.name),
                task.readerDefinition == null ? null : new DefinitionRefResponse(task.readerDefinition.id, task.readerDefinition.name)
        );
    }
}
