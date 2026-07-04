export interface ProcessExecutionRecord {
  id: number;
  processDefinitionId: number;
  processName: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  sourceExecutionId: number | null;
  triggerSource: string | null;
  details: string | null;
}

export interface ExecutionNavigationEntry {
  executionId: number;
  label: string;
}

export interface ProcessedSourceFileRecord {
  id: number;
  fileName: string | null;
  filePath: string | null;
  mediaType: string | null;
  fileSize: number | null;
  lastModified: string | null;
  status: string | null;
  recordCount: number | null;
  skippedCount: number | null;
  writtenCount: number | null;
  errorMessage: string | null;
}

export interface ProcessedFileFilters {
  name: string;
  path: string;
  status: string;
  modifiedFrom: string;
  modifiedTo: string;
  minSize: string;
  maxSize: string;
}

export interface TaskSkippedRowRecord {
  rowNumber: number | null;
  reason: string;
}

export interface TaskProcessedFileSummaryRecord {
  fileName: string | null;
  filePath: string | null;
  fileSize: number | null;
  lastModified: string | null;
  recordCount: number | null;
  skippedCount: number | null;
  writtenCount: number | null;
  status?: string | null;
  message?: string;
}

export interface TaskReadSummary {
  summary: string;
  completedFilesCount: number | null;
  validCount: number | null;
  skippedCount: number | null;
  writtenCount: number | null;
  skippedRows: TaskSkippedRowRecord[];
  files: TaskProcessedFileSummaryRecord[];
  failedFiles: TaskProcessedFileSummaryRecord[];
}

export interface TaskDbWriteSummary {
  processedCount: number | null;
  writtenCount: number | null;
  mode: string | null;
  targetTable: string | null;
}

export interface TaskFailureSummary {
  title: string;
  summary: string;
}

export type ExecutionFileActionKind = 'retryFailed' | 'processPending' | 'reprocessSelected';

export interface ExecutionFileActionRequest {
  kind: ExecutionFileActionKind;
  files: ProcessedSourceFileRecord[];
}

export interface ProcessTaskExecutionRecord {
  id: number;
  processExecutionId: number;
  taskDefinitionId: number;
  taskOrder: number;
  taskType: string;
  status: string;
  executedAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  details: string | null;
  payloadJson: string | null;
  processedFiles: ProcessedSourceFileRecord[];
}

// --- Progreso en vivo (ADR-015): espejo de ExecutionProgressService.ExecutionProgress del backend ---

/**
 * Progreso de una tarea scatter (N→1 / page-chain). {@code streaming=true}/{@code percent=null} ⇒
 * page-chain sin sellar (mostrar indeterminado, sin % ni ETA falsos); {@code percent} solo si hay total.
 */
export interface TaskScatterProgress {
  taskDefinitionId: number;
  completed: number;
  failed: number;
  total: number | null;
  streaming: boolean;
  percent: number | null;
  status: string | null;
  lastProgressAt: string | null;
}

/** Progreso en vivo de una tarea batch síncrona: contador acumulativo (sin total conocido). */
export interface SyncTaskProgress {
  taskDefinitionId: number;
  recordsProcessed: number;
}

/** Salud del backbone async embebida en el progreso (filas muertas del DLQ). */
export interface DlqPipelineSummary {
  outboxDead: number;
  inboxDead: number;
  inboxPoison: number;
}

/** Progreso agregado de una ejecución: tareas scatter + tareas sync + salud del pipeline. */
export interface ExecutionProgress {
  executionId: number;
  scatterTasks: TaskScatterProgress[];
  syncTasks: SyncTaskProgress[];
  pipeline: DlqPipelineSummary;
}
