package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.repository.PluginInvocationMetricRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
}
