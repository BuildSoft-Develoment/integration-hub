/**
 * Entrada de la linea de tiempo E2E de un registro (ADR-010 / ADR-019): observabilidad generica de
 * plataforma, compartida por la trazabilidad del core de auditoria y por los packs de estandar
 * (p.ej. SWIFT MT101, que embebe el lineage por fila).
 */
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
