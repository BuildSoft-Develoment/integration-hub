package com.integrationhub.platform.api.resource.process;

import com.integrationhub.platform.service.execution.TaskTypeCatalogEntry;
import com.integrationhub.platform.service.execution.TaskTypeCatalogService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TaskTypeCatalogResourceTest {

    @Test
    void returnsTaskTypeCatalogResponse() {
        var service = mock(TaskTypeCatalogService.class);
        when(service.catalog()).thenReturn(List.of(new TaskTypeCatalogEntry(
                "ACME_DO",
                "REMOTE",
                "backend-plugin",
                "acme",
                "1.0.0",
                "KAFKA",
                "AVAILABLE",
                null,
                "UNSUPPORTED",
                true)));
        var resource = new TaskTypeCatalogResource(service);

        var response = resource.list();

        assertEquals(1, response.taskTypes().size());
        assertEquals("ACME_DO", response.taskTypes().getFirst().type());
        assertEquals("REMOTE", response.taskTypes().getFirst().origin());
        assertEquals("acme", response.taskTypes().getFirst().pluginId());
        assertEquals("UNSUPPORTED", response.taskTypes().getFirst().asyncOffload());
        // ADR-021: el flag viaja al frontend para decidir si un tipo sin form compilado se puede ofrecer.
        assertEquals(true, response.taskTypes().getFirst().configurable());
    }
}
