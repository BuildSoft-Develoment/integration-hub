package com.integrationhub.platform.service.execution.async;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

class TaskDispatchPlannerTest {

    private final TaskDispatchPlanner planner = new TaskDispatchPlanner();

    @Test
    void syncByDefaultWhenNoAsyncFlag() {
        var dispatch = planner.plan(Map.of("executionMode", "batch"));
        assertFalse(dispatch.isAsync());
        assertEquals(TaskDispatch.Mode.SYNC, dispatch.mode());
        assertNull(dispatch.transport());
    }

    @Test
    void syncWhenConfigurationIsNull() {
        assertFalse(planner.plan(null).isAsync());
    }

    @Test
    void asyncKafkaByDefaultWhenAsyncWithoutTransport() {
        var dispatch = planner.plan(Map.of("async", true));
        assertTrue(dispatch.isAsync());
        assertEquals("KAFKA", dispatch.transport());
    }

    @Test
    void asyncWithExplicitTransportNormalizedToUpperCase() {
        var dispatch = planner.plan(Map.of("async", true, "transport", "rabbitmq"));
        assertTrue(dispatch.isAsync());
        assertEquals("RABBITMQ", dispatch.transport());
    }

    @Test
    void asyncWhenAsyncFlagIsStringTrue() {
        var config = new HashMap<String, Object>();
        config.put("async", "true");
        assertTrue(planner.plan(config).isAsync());
    }

    @Test
    void syncWhenAsyncFlagIsFalse() {
        assertFalse(planner.plan(Map.of("async", false)).isAsync());
    }
}
