package com.integrationhub.platform.service.execution.async;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class TaskOutboxRetryPolicyTest {

    @Test
    void retriesUpToMaxAttempts() {
        var policy = new TaskOutboxRetryPolicy(3, 1000L, 300_000L);
        assertTrue(policy.shouldRetry(1));
        assertTrue(policy.shouldRetry(3));
        assertFalse(policy.shouldRetry(4));
    }

    @Test
    void backoffGrowsExponentiallyAndCaps() {
        var policy = new TaskOutboxRetryPolicy(20, 1000L, 8000L);
        assertEquals(1000L, policy.backoffMillis(1));
        assertEquals(2000L, policy.backoffMillis(2));
        assertEquals(4000L, policy.backoffMillis(3));
        assertEquals(8000L, policy.backoffMillis(4));
        assertEquals(8000L, policy.backoffMillis(5));
    }

    @Test
    void largeAttemptCapsWithoutOverflow() {
        var policy = new TaskOutboxRetryPolicy(100, 1000L, 300_000L);
        assertEquals(300_000L, policy.backoffMillis(50));
    }
}
