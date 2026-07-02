package com.integrationhub.platform.service.execution;

import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * El job de retencion purga SENT (spool) y DLQ cuando esta habilitado; nada si se apaga.
 */
class AuditSpoolMaintenanceSchedulerTest {

    private static final class RecordingOps extends AuditSpoolOperationsService {
        final AtomicInteger sentCalls = new AtomicInteger();
        final AtomicInteger dlqCalls = new AtomicInteger();
        int lastRetentionDays;
        int lastLimit;
        int lastDlqRetentionDays;

        RecordingOps() {
            super(null);
        }

        @Override
        public long cleanupSent(int retentionDays, int limit) {
            sentCalls.incrementAndGet();
            lastRetentionDays = retentionDays;
            lastLimit = limit;
            return 5;
        }

        @Override
        public long cleanupDeadLetters(int retentionDays, int limit) {
            dlqCalls.incrementAndGet();
            lastDlqRetentionDays = retentionDays;
            return 2;
        }
    }

    @Test
    void purgesSpoolAndDlqWhenEnabled() {
        var ops = new RecordingOps();
        new AuditSpoolMaintenanceScheduler(ops, true, 7, 10000, 30).cleanup();
        assertEquals(1, ops.sentCalls.get());
        assertEquals(1, ops.dlqCalls.get());
        assertEquals(7, ops.lastRetentionDays);
        assertEquals(10000, ops.lastLimit);
        assertEquals(30, ops.lastDlqRetentionDays);
    }

    @Test
    void skipsWhenDisabled() {
        var ops = new RecordingOps();
        new AuditSpoolMaintenanceScheduler(ops, false, 7, 10000, 30).cleanup();
        assertEquals(0, ops.sentCalls.get());
        assertEquals(0, ops.dlqCalls.get());
    }
}
