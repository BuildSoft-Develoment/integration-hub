package com.integrationhub.platform.service.process;

import com.integrationhub.platform.api.mapper.process.ProcessDefinitionApiMapper;
import com.integrationhub.platform.api.response.process.ProcessScheduleResponse;
import com.integrationhub.platform.entity.ProcessDefinition;
import com.integrationhub.platform.repository.ProcessDefinitionRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProcessScheduleQueryServiceTest {

    @Test
    void listScheduledMapsRepositoryResults() {
        ProcessDefinitionRepository repository = mock(ProcessDefinitionRepository.class);
        ProcessDefinitionApiMapper apiMapper = mock(ProcessDefinitionApiMapper.class);

        ProcessDefinition definition = new ProcessDefinition();
        ProcessScheduleResponse expected = new ProcessScheduleResponse(
                1L, "carga-diaria", "carga nocturna", true, true, "0 0 2 * * ?", null, null);
        when(repository.listScheduled()).thenReturn(List.of(definition));
        when(apiMapper.toScheduleResponse(definition)).thenReturn(expected);

        List<ProcessScheduleResponse> result =
                new ProcessScheduleQueryService(repository, apiMapper).listScheduled();

        assertEquals(1, result.size());
        assertSame(expected, result.get(0));
        verify(repository).listScheduled();
    }

    @Test
    void listScheduledReturnsEmptyWhenNoneScheduled() {
        ProcessDefinitionRepository repository = mock(ProcessDefinitionRepository.class);
        ProcessDefinitionApiMapper apiMapper = mock(ProcessDefinitionApiMapper.class);
        when(repository.listScheduled()).thenReturn(List.of());

        List<ProcessScheduleResponse> result =
                new ProcessScheduleQueryService(repository, apiMapper).listScheduled();

        assertEquals(0, result.size());
    }
}
