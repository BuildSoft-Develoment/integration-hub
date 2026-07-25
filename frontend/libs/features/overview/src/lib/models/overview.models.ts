export interface OverviewMetricRecord {
  total: number;
  active: number;
}

/** Severidad/tono de una faceta o señal de salud. */
export type OverviewSeverity = 'ok' | 'warn' | 'error';

/** KPI de inventario del overview: número grande + total activo (o `null` si no aplica). */
export interface OverviewKpi {
  key: string;
  titleKey: string;
  value: number;
  activeCount: number | null;
}

/** Una faceta de una señal de salud: etiqueta + valor + tono (color). */
export interface OverviewHealthStat {
  readonly labelKey: string;
  readonly value: number;
  readonly tone: OverviewSeverity;
}

/**
 * Señal de salud operativa del overview (ejecuciones, reintentos, archivos, plugins, backbone async).
 * `alert` es la severidad agregada de la señal; `stats` son sus facetas; el resto es la acción directa.
 * El store es la única fuente de verdad de la severidad → banner agregado y card nunca divergen.
 */
export interface OverviewHealthSignal {
  key: string;
  titleKey: string;
  alert: 'warn' | 'error' | null;
  stats: readonly OverviewHealthStat[];
  linkRoute: readonly string[];
  linkLabelKey: string;
}

/** Resumen agregado de la salud operativa para el banner de estado. */
export interface OverviewHealthSummary {
  critical: number;
  warning: number;
  stable: number;
  worst: 'warn' | 'error' | null;
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
  // Salud del backbone async (ADR-015): filas muertas del DLQ + scatters streaming estancados.
  asyncDeadLetters: number;
  asyncStalledScatters: number;
  recentExecutions: OverviewExecutionRecord[];
  recentAuditEvents: OverviewAuditRecord[];
  failedExecutionHighlights: OverviewExecutionRecord[];
}
