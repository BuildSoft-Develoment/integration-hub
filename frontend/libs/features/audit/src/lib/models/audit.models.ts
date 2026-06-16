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
  stagingIdFrom: number;
  stagingIdTo: number;
  sourceRecordFrom: number | null;
  sourceRecordTo: number | null;
  sourceFileHash: string | null;
  fragmentIndex: number;
  fragmentTotal: number;
  sendersReference: string | null;
  status: string | null;
  errorMessage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Mt101ReprocessResult {
  fragmentSetId: string;
  fromStatus: string;
  toStatus: string;
  affected: number;
}

export interface Mt101FailedRecord {
  id: number;
  fragmentSetId: string;
  sendersReference: string | null;
  transactionReference: string | null;
  sourceFileHash: string | null;
  sourceRecordNumber: number | null;
  ruleCode: string | null;
  ruleSet: string | null;
  severity: string | null;
  message: string | null;
  status: string;
  createdAt: string | null;
  resolvedAt: string | null;
}

export interface Mt101QuarantineBuildResult {
  fragmentSetId: string;
  quarantined: number;
}

export interface Mt101RebuildResult {
  correctiveSetId: string;
  fragmentCount: number;
  rebuiltRows: number;
  supersededFragments: number;
  resolvedQuarantine: number;
}

export interface Mt101FragmentSetSummary {
  fragmentSetId: string;
  total: number;
  byStatus: Record<string, number>;
}

export interface Mt101RowTimelineEntry {
  stage: string;
  status: string;
  detail: string;
}

export interface Mt101LoteHeader {
  fragmentSetId: string;
  processExecutionId: number | null;
  sourceFileName: string | null;
  sourceFileHash: string | null;
  rowCount: number;
  totalFragments: number;
  byStatus: Record<string, number>;
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
