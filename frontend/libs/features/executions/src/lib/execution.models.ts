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
