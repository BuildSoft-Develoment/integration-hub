export interface AuditProcessedFileRecord {
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

export interface RecordLineageEntry {
  recordId: string | null;
  traceId: string | null;
  stage: string;
  status: string | null;
  processExecutionId: number | null;
  taskDefinitionId: number | null;
  message: string | null;
  payloadJson: string | null;
  standard: string | null;
  messageType: string | null;
  sourceFileName: string | null;
  sourceFileHash: string | null;
  recordNumber: number | null;
  businessKey: string | null;
  businessKeyHash: string | null;
  paymentReference: string | null;
  transactionReference: string | null;
  uetr: string | null;
  archiveId: number | null;
  gatewayReference: string | null;
  eventTs: string | null;
}

export interface AuditRecord {
  id: number;
  processExecutionId: number | null;
  processDefinitionId: number | null;
  sourceExecutionId: number | null;
  triggerSource: string | null;
  taskDefinitionId: number | null;
  taskType: string | null;
  eventType: string;
  status: string;
  message: string | null;
  payloadJson: string | null;
  createdAt: string | null;
  processedFiles: AuditProcessedFileRecord[];
}
