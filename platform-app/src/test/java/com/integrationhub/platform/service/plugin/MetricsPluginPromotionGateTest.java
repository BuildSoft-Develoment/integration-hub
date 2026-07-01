package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.repository.PluginInvocationMetricRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MetricsPluginPromotionGateTest {

    @Test
    void allowsPromotionWhenCanaryWindowIsHealthy() {
        var repository = mock(PluginInvocationMetricRepository.class);
        when(repository.summarize(eq("acme"), eq("1.1.0"), any()))
                .thenReturn(new PluginInvocationMetricRepository.PluginMetricSummary(3, 0));
        var gate = new MetricsPluginPromotionGate(repository, 3, 0.0, 24);

        assertDoesNotThrow(() -> gate.assertPromotable("acme", "1.1.0"));
    }

    @Test
    void rejectsPromotionWithoutMinimumSamples() {
        var repository = mock(PluginInvocationMetricRepository.class);
        when(repository.summarize(eq("acme"), eq("1.1.0"), any()))
                .thenReturn(new PluginInvocationMetricRepository.PluginMetricSummary(2, 0));
        var gate = new MetricsPluginPromotionGate(repository, 3, 0.0, 24);

        assertThrows(IllegalStateException.class, () -> gate.assertPromotable("acme", "1.1.0"));
    }

    @Test
    void rejectsPromotionWhenFailureRatioExceedsPolicy() {
        var repository = mock(PluginInvocationMetricRepository.class);
        when(repository.summarize(eq("acme"), eq("1.1.0"), any()))
                .thenReturn(new PluginInvocationMetricRepository.PluginMetricSummary(4, 1));
        var gate = new MetricsPluginPromotionGate(repository, 3, 0.0, 24);

        assertThrows(IllegalStateException.class, () -> gate.assertPromotable("acme", "1.1.0"));
    }

    @Test
    void evaluateReportsPromotableWhenWindowIsHealthy() {
        var repository = mock(PluginInvocationMetricRepository.class);
        when(repository.summarize(eq("acme"), eq("1.1.0"), any()))
                .thenReturn(new PluginInvocationMetricRepository.PluginMetricSummary(4, 0));
        var gate = new MetricsPluginPromotionGate(repository, 3, 0.0, 24);

        var status = gate.evaluate("acme", "1.1.0");

        assertEquals("acme", status.pluginId());
        assertEquals("1.1.0", status.version());
        assertEquals(4, status.totalSamples());
        assertEquals(0, status.failures());
        assertEquals(0.0, status.failureRatio());
        assertEquals(3, status.minSamples());
        assertEquals(24, status.windowHours());
        assertTrue(status.promotable());
        assertNull(status.blockReason());
    }

    @Test
    void evaluateFlagsInsufficientSamplesWithoutThrowing() {
        var repository = mock(PluginInvocationMetricRepository.class);
        when(repository.summarize(eq("acme"), eq("1.1.0"), any()))
                .thenReturn(new PluginInvocationMetricRepository.PluginMetricSummary(1, 0));
        var gate = new MetricsPluginPromotionGate(repository, 3, 0.0, 24);

        var status = gate.evaluate("acme", "1.1.0");

        assertFalse(status.promotable());
        assertEquals("INSUFFICIENT_SAMPLES", status.blockReason());
    }

    @Test
    void evaluateFlagsFailureRatioExceeded() {
        var repository = mock(PluginInvocationMetricRepository.class);
        when(repository.summarize(eq("acme"), eq("1.1.0"), any()))
                .thenReturn(new PluginInvocationMetricRepository.PluginMetricSummary(4, 2));
        var gate = new MetricsPluginPromotionGate(repository, 3, 0.0, 24);

        var status = gate.evaluate("acme", "1.1.0");

        assertFalse(status.promotable());
        assertEquals(0.5, status.failureRatio());
        assertEquals("FAILURE_RATIO_EXCEEDED", status.blockReason());
    }
}
