package com.integrationhub.platform.api.response.execution;

import java.util.List;

public record OverviewSummaryResponse(
        OverviewMetricResponse sources,
        OverviewMetricResponse readers,
        OverviewMetricResponse processes,
        long scheduledProcesses,
        long runningExecutions,
        long failedExecutions,
        long completedWithErrorsExecutions,
        long retryExecutions,
        long failedProcessedFiles,
        long pendingProcessedFiles,
        // Salud del backbone async (ADR-015): filas muertas del DLQ + scatters streaming estancados.
        long asyncDeadLetters,
        long asyncStalledScatters,
        List<ProcessExecutionResponse> recentExecutions,
        List<AuditEventResponse> recentAuditEvents,
        List<ProcessExecutionResponse> failedExecutionHighlights
) {
}
