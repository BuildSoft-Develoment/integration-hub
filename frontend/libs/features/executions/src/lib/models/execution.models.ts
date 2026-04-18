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
