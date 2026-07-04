// Modelos de la consola de operaciones DLQ async (ADR-015). Espejo de los records del backend
// AsyncTaskDlqService: DlqSummary, DeadTask, StalledScatter.

/** Salud del backbone async: filas muertas en outbox e inbox. */
export interface DlqSummary {
  outboxDead: number;
  inboxDead: number;
  inboxPoison: number;
}

/** Fila muerta del consumer (DEAD/POISON), para inspección y redrive. */
export interface DeadTask {
  id: number;
  idempotencyKey: string;
  taskType: string | null;
  processExecutionId: number | null;
  taskDefinitionId: number | null;
  status: string;
  error: string | null;
}

/** Scatter en streaming (page-chain) estancado: candidato a re-inyección (requeue reanuda la cadena). */
export interface StalledScatter {
  processExecutionId: number;
  taskDefinitionId: number;
  completed: number;
  failed: number;
  lastPageIndex: number | null;
  lastProgressAt: string | null;
}
