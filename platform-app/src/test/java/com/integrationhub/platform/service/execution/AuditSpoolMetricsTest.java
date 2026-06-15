package com.integrationhub.platform.service.execution;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Los gauges del spool reflejan el snapshot tras refresh().
 */
class AuditSpoolMetricsTest {

    private static final class FixedOps extends AuditSpoolOperationsService {
        FixedOps() {
            super(null);
        }

        @Override
        public Summary summary() {
            return new Summary(7, 2, 100, 1, LocalDateTime.now().minusSeconds(120));
        }

        @Override
        public long deadLetterCount() {
            return 4;
        }
    }

    @Test
    void gaugesReflectSnapshot() {
        var registry = new SimpleMeterRegistry();
        var metrics = new AuditSpoolMetrics(registry, new FixedOps());
        metrics.refresh();

        assertEquals(7, registry.get("audit_spool_pending").gauge().value());
        assertEquals(2, registry.get("audit_spool_in_flight").gauge().value());
        assertEquals(1, registry.get("audit_spool_dead").gauge().value());
        assertEquals(4, registry.get("audit_dead_letter_total").gauge().value());
        assertTrue(registry.get("audit_spool_oldest_pending_age_seconds").gauge().value() >= 110,
                "edad del pending mas viejo en segundos");
    }
}
