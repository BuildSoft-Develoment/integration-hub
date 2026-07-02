package com.integrationhub.platform.service.plugin;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CanaryRolloutSelectorTest {

    private final CanaryRolloutSelector selector = new CanaryRolloutSelector();

    @Test
    void zeroOrNullWeightNeverRoutesToCanary() {
        assertFalse(selector.routesToCanary(0, "tenant-1"));
        assertFalse(selector.routesToCanary(null, "tenant-1"));
    }

    @Test
    void hundredWeightAlwaysRoutesToCanary() {
        assertTrue(selector.routesToCanary(100, "tenant-1"));
        assertTrue(selector.routesToCanary(150, "tenant-1"));
    }

    @Test
    void decisionIsStickyPerSegmentKey() {
        var first = selector.routesToCanary(50, "tenant-42");
        for (int i = 0; i < 100; i++) {
            assertEquals(first, selector.routesToCanary(50, "tenant-42"));
        }
    }

    @Test
    void distributionApproximatesTheWeightAcrossManySegments() {
        int canary = 0;
        int total = 1000;
        for (int i = 0; i < total; i++) {
            if (selector.routesToCanary(30, "segment-" + i)) {
                canary++;
            }
        }
        // Expect ~30%; allow a generous band for hash variance.
        assertTrue(canary > 200 && canary < 400, "canary share out of band: " + canary);
    }
}
