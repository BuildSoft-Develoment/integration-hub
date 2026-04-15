export interface OverviewMetricRecord {
  total: number;
  active: number;
}

export interface OverviewExecutionRecord {
  id: number;
  processDefinitionId: number;
  processName: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface OverviewAuditRecord {
  id: number;
  processExecutionId: number | null;
  eventType: string;
  status: string;
  message: string | null;
  createdAt: string | null;
}

export interface OverviewSummaryRecord {
  sources: OverviewMetricRecord;
  readers: OverviewMetricRecord;
  processes: OverviewMetricRecord;
  scheduledProcesses: number;
  runningExecutions: number;
  failedExecutions: number;
  completedWithErrorsExecutions: number;
  retryExecutions: number;
  failedProcessedFiles: number;
  pendingProcessedFiles: number;
  recentExecutions: OverviewExecutionRecord[];
  recentAuditEvents: OverviewAuditRecord[];
  failedExecutionHighlights: OverviewExecutionRecord[];
}
