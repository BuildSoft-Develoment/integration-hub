package com.integrationhub.platform.service.execution.async;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class TaskIdempotencyTest {

    @Test
    void deterministicForSameInputs() {
        assertEquals(
                TaskIdempotency.key(42L, 7L, "batch-3"),
                TaskIdempotency.key(42L, 7L, "batch-3"));
    }

    @Test
    void differsBySlice() {
        assertNotEquals(
                TaskIdempotency.key(42L, 7L, "batch-3"),
                TaskIdempotency.key(42L, 7L, "batch-4"));
    }

    @Test
    void differsByTask() {
        assertNotEquals(
                TaskIdempotency.key(42L, 7L, "batch-3"),
                TaskIdempotency.key(42L, 8L, "batch-3"));
    }

    @Test
    void producesSixtyFourHexChars() {
        var key = TaskIdempotency.key(1L, 1L, null);
        assertEquals(64, key.length());
        assertTrue(key.matches("[0-9a-f]{64}"));
    }
}
