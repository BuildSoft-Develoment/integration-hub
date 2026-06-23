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
  stagingId: number | null;
  sourceTaskDefinitionId: number | null;
  sourceName: string | null;
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
  rebuildRunId?: string;
  correctiveSetId: string;
  fragmentCount: number;
  rebuiltRows: number;
  supersededFragments: number;
  resolvedQuarantine: number;
}

/** B2': estado del ciclo bancario del correctivo tras avanzar/enviar (BUILT/VALIDATED/ARCHIVED/SENT/...). */
export interface Mt101CorrectiveLifecycle {
  rebuildRunId: string;
  correctiveSetId: string;
  status: string;
  /** P2/P1-API v23: estado real del PAY (NOT_REQUESTED/REQUESTED/.../SENT/UNCERTAIN), reflejando el update recién aplicado. */
  payStatus?: string;
  /** P2 v20: resultado de MT101_STATUS tras el PAY (separado de status; PENDING/OK/FAILED/SKIPPED). */
  statusSyncStatus?: string;
  /** P2 v20: resultado de MT101_RECONCILE tras el PAY (separado de status). */
  reconciliationStatus?: string;
  /** P1-API v23: evidencia de gobierno del PAY, visible para el operador (no solo en BD). */
  payRequestReason?: string;
  payRequestTicket?: string;
  payResolvedBy?: string;
  payResolutionReason?: string;
}

/** Estado de un rebuild run gobernado: REQUESTED -> APPROVED -> BUILT -> VALIDATED/ARCHIVED/SENT/CONFIRMED/RECONCILED. */
export interface Mt101RebuildRunSummary {
  rebuildRunId: string;
  originalFragmentSetId: string;
  correctiveSetId: string;
  status: string;
  selectedRows: number;
  affectedFragments: number;
  connectionRef: string | null;
  payStatus: string | null;
  payRequestedBy: string | null;
  payApprovedBy: string | null;
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
  eventTs: string | null;
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
