package com.integrationhub.platform.service.process;

import com.integrationhub.platform.repository.ProcessDefinitionRepository;
import com.integrationhub.platform.service.execution.AuditService;
import com.integrationhub.platform.service.execution.ProcessExecutionCommandService;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

// @covers RF-002, RF-003 (reingenieria: prueba que cubre el/los RF en produccion)
class ProcessSchedulerServiceTest {

    private final ProcessSchedulerService service = new ProcessSchedulerService(
            mock(ProcessExecutionCommandService.class),
            mock(AuditService.class),
            mock(ProcessDefinitionRepository.class));

    @Test
    void parseEverySupportsSeconds() {
        assertEquals(Duration.ofSeconds(30), service.parseEvery("30s"));
    }

    @Test
    void parseEverySupportsMinutes() {
        assertEquals(Duration.ofMinutes(5), service.parseEvery("5m"));
    }

    @Test
    void parseEveryNormalizesCaseAndTrimsWhitespace() {
        assertEquals(Duration.ofHours(1), service.parseEvery("  1H  "));
    }

    @Test
    void parseEveryRejectsNull() {
        assertThrows(IllegalArgumentException.class, () -> service.parseEvery(null));
    }

    @Test
    void parseEveryRejectsBlank() {
        assertThrows(IllegalArgumentException.class, () -> service.parseEvery("   "));
    }
}
