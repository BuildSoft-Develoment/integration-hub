package com.integrationhub.platform.service.execution;

import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * El job de retencion purga SENT cuando esta habilitado y no hace nada si se apaga.
 */
class AuditSpoolMaintenanceSchedulerTest {

    private static final class RecordingOps extends AuditSpoolOperationsService {
        final AtomicInteger calls = new AtomicInteger();
        int lastRetentionDays;
        int lastLimit;

        RecordingOps() {
            super(null);
        }

        @Override
        public long cleanupSent(int retentionDays, int limit) {
            calls.incrementAndGet();
            lastRetentionDays = retentionDays;
            lastLimit = limit;
            return 5;
        }
    }

    @Test
    void purgesWhenEnabled() {
        var ops = new RecordingOps();
        new AuditSpoolMaintenanceScheduler(ops, true, 7, 10000).cleanup();
        assertEquals(1, ops.calls.get());
        assertEquals(7, ops.lastRetentionDays);
        assertEquals(10000, ops.lastLimit);
    }

    @Test
    void skipsWhenDisabled() {
        var ops = new RecordingOps();
        new AuditSpoolMaintenanceScheduler(ops, false, 7, 10000).cleanup();
        assertEquals(0, ops.calls.get());
    }
}
