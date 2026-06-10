package com.integrationhub.platform.spi.task;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 003 T-017 (M-2 suspension engine), ADR-009
 */
class TaskResultTest {

    @Test
    void successFactoryHasSuspendedFalseAndEmptySuspendedState() {
        var result = TaskResult.success("ok");
        assertTrue(result.success());
        assertFalse(result.suspended());
        assertEquals("ok", result.details());
        assertTrue(result.outputs().isEmpty());
        assertTrue(result.suspendedState().isEmpty());
    }

    @Test
    void successWithOutputsPreservesOutputs() {
        var result = TaskResult.success("ok", Map.of("k", "v"));
        assertTrue(result.success());
        assertFalse(result.suspended());
        assertEquals("v", result.outputs().get("k"));
    }

    @Test
    void failureFactoryHasSuspendedFalse() {
        var result = TaskResult.failure("bad");
        assertFalse(result.success());
        assertFalse(result.suspended());
        assertEquals("bad", result.details());
    }

    @Test
    void suspendedFactoryReportsSuspendedAndPreservesState() {
        var state = Map.<String, Object>of("nextPollAt", "2026-06-09T12:00Z", "attempt", 1);
        var result = TaskResult.suspended("waiting for callback", state);
        assertTrue(result.success(), "suspended NO debe ser interpretado como failure");
        assertTrue(result.suspended());
        assertEquals("waiting for callback", result.details());
        assertEquals("2026-06-09T12:00Z", result.suspendedState().get("nextPollAt"));
        assertEquals(1, result.suspendedState().get("attempt"));
        assertTrue(result.outputs().isEmpty(), "suspended no publica outputs (todavia no hay)");
    }

    @Test
    void suspendedStateIsImmutable() {
        var state = new java.util.HashMap<String, Object>();
        state.put("k", "v");
        var result = TaskResult.suspended("d", state);
        state.put("k", "MUTATED");
        assertEquals("v", result.suspendedState().get("k"),
                "state debe ser copia defensiva (no referencia)");
        assertThrows(UnsupportedOperationException.class,
                () -> result.suspendedState().put("hack", "x"));
    }

    @Test
    void nullSuspendedStateBecomesEmptyMap() {
        var result = TaskResult.suspended("d", null);
        assertTrue(result.suspendedState().isEmpty());
    }
}
