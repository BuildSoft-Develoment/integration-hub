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

export interface AuditSpoolSummary {
  pending: number;
  inFlight: number;
  sent: number;
  dead: number;
  oldestPendingCreatedAt: string | null;
}

export interface AuditSpoolEntry {
  id: number;
  eventId: string | null;
  traceId: string | null;
  topic: string | null;
  partitionKey: string | null;
  spoolStatus: string | null;
  attempts: number;
  lastError: string | null;
  createdAt: string | null;
  sentAt: string | null;
  lockedBy: string | null;
  lockedAt: string | null;
  nextAttemptAt: string | null;
  deadAt: string | null;
  deadReason: string | null;
}

export interface AuditSpoolCleanupResult {
  deleted: number;
}

export interface Mt101FragmentLink {
  fragmentSetId: string | null;
  processExecutionId: number | null;
  taskDefinitionId: number | null;
  sourceTable: string | null;
  sourceRowFrom: number;
  sourceRowTo: number;
  fragmentIndex: number;
  fragmentTotal: number;
  sendersReference: string | null;
  status: string | null;
  errorMessage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
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
