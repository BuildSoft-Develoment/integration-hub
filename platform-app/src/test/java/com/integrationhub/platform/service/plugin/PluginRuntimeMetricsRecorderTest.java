package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.entity.PluginInvocationMetric;
import com.integrationhub.platform.repository.PluginInvocationMetricRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class PluginRuntimeMetricsRecorderTest {

    @Test
    void persistsInvocationMetric() {
        var repository = mock(PluginInvocationMetricRepository.class);
        var recorder = new PluginRuntimeMetricsRecorder(repository);
        var recordedAt = LocalDateTime.of(2026, 7, 1, 6, 0);

        recorder.record(new PluginInvocationMetricCommand(
                "acme",
                "1.1.0",
                "ACME_DO",
                "KAFKA",
                true,
                "SUCCESS",
                42,
                null,
                recordedAt));

        verify(repository).persist(argThat((PluginInvocationMetric metric) ->
                "acme".equals(metric.pluginId)
                        && "1.1.0".equals(metric.version)
                        && "ACME_DO".equals(metric.taskType)
                        && "KAFKA".equals(metric.transport)
                        && metric.success
                        && "SUCCESS".equals(metric.outcome)
                        && metric.durationMs == 42
                        && recordedAt.equals(metric.recordedAt)));
    }

    @Test
    void rejectsMetricWithoutPluginIdentity() {
        var recorder = new PluginRuntimeMetricsRecorder(mock(PluginInvocationMetricRepository.class));

        assertThrows(IllegalArgumentException.class, () -> recorder.record(new PluginInvocationMetricCommand(
                "",
                "1.1.0",
                "ACME_DO",
                "KAFKA",
                true,
                "SUCCESS",
                1,
                null,
                null)));
    }
}
