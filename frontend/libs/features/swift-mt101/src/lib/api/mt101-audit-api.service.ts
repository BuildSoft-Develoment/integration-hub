import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Mt101CorrectiveLifecycle,
  Mt101CorrectionApply,
  Mt101CorrectionPreview,
  Mt101FailedRecord,
  Mt101RuleSummary,
  Mt101FragmentLink,
  Mt101FragmentSetSummary,
  Mt101LoteHeader,
  Mt101NormalPayResolution,
  Mt101OpenPayConflict,
  Mt101OpenPayConflictConfirmation,
  Mt101OpenPayConflictsPage,
  Mt101PayAction,
  Mt101PayConflict,
  Mt101PayDispatchIntent,
  Mt101PayDispatchReconcileResult,
  Mt101PayDispatchSummary,
  Mt101PhysicalLineLineage,
  Mt101QuarantineBuildResult,
  Mt101RebuildResult,
  Mt101RebuildRunSummary,
  Mt101ReprocessResult,
  Mt101RowTimelineEntry,
  Mt101StagingRowView,
} from '../models/mt101.models';

/**
 * API del pack SWIFT MT101 (ADR-019): consultas y operaciones gobernadas de fragmentos, cuarentena,
 * PAY dispatch y conflictos. Extraida de AuditApiService para separar el vertical del estandar de la
 * observabilidad generica de plataforma. Todos los endpoints son /api/query/mt101-*.
 */
@Injectable({ providedIn: 'root' })
export class Mt101AuditApiService {
  private readonly http = inject(HttpClient);

  mt101FragmentLinks(query: {
    connectionRef?: string;
    recordNumber: number | string;
    sourceFileHash: string;
    sourceTable?: string;
    processExecutionId?: number | string;
    fragmentSetId?: string;
    limit?: number;
  }): Observable<Mt101FragmentLink[]> {
    let httpParams = new HttpParams()
      .set('recordNumber', String(query.recordNumber))
      .set('sourceFileHash', query.sourceFileHash.trim())
      .set('limit', String(query.limit ?? 20));
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    if (query.sourceTable?.trim()) {
      httpParams = httpParams.set('sourceTable', query.sourceTable.trim());
    }
    if (query.processExecutionId !== undefined && String(query.processExecutionId).trim()) {
      httpParams = httpParams.set('processExecutionId', String(query.processExecutionId).trim());
    }
    if (query.fragmentSetId?.trim()) {
      httpParams = httpParams.set('fragmentSetId', query.fragmentSetId.trim());
    }
    return this.http.get<Mt101FragmentLink[]>('/api/query/mt101-fragments/source-row', { params: httpParams });
  }

  /** Resumen del lote: total de fragmentos + conteo por estado. */
  mt101FragmentSetSummary(query: { connectionRef?: string; fragmentSetId: string }): Observable<Mt101FragmentSetSummary> {
    let httpParams = new HttpParams().set('fragmentSetId', query.fragmentSetId);
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.get<Mt101FragmentSetSummary>('/api/query/mt101-fragments/summary', { params: httpParams });
  }

  /**
   * G-A (búsqueda inversa enriquecida): "archivo + línea física" → LISTA de registros de staging (uno por ejecución:
   * reprocesos visibles), cada uno con su resumen de cuarentena si falló validación.
   */
  mt101ByPhysicalLine(query: {
    connectionRef?: string;
    sourceFileHash: string;
    physicalLine: number;
    processExecutionId?: number;
  }): Observable<Mt101PhysicalLineLineage[]> {
    let httpParams = new HttpParams()
      .set('sourceFileHash', query.sourceFileHash.trim())
      .set('physicalLine', String(query.physicalLine));
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    if (query.processExecutionId != null) {
      httpParams = httpParams.set('processExecutionId', String(query.processExecutionId));
    }
    return this.http.get<Mt101PhysicalLineLineage[]>(
      '/api/query/mt101-fragments/by-physical-line', { params: httpParams });
  }

  /**
   * #4 (Excel): "archivo + hoja + fila Excel" → LISTA de registros de staging (uno por ejecución), cada uno con su
   * resumen de cuarentena. Espejo de {@link mt101ByPhysicalLine} para la clave operativa de Excel.
   */
  mt101BySheetRow(query: {
    connectionRef?: string;
    sourceFileHash: string;
    sheetName: string;
    sheetRow: number;
    processExecutionId?: number;
  }): Observable<Mt101PhysicalLineLineage[]> {
    let httpParams = new HttpParams()
      .set('sourceFileHash', query.sourceFileHash.trim())
      .set('sheetName', query.sheetName.trim())
      .set('sheetRow', String(query.sheetRow));
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    if (query.processExecutionId != null) {
      httpParams = httpParams.set('processExecutionId', String(query.processExecutionId));
    }
    return this.http.get<Mt101PhysicalLineLineage[]>(
      '/api/query/mt101-fragments/by-sheet-row', { params: httpParams });
  }

  /** v60: lista detallada de fragmentos en conflicto de pago del set (:20:, estado real, motivo, fecha). */
  mt101PayConflicts(query: { connectionRef?: string; fragmentSetId: string }): Observable<Mt101PayConflict[]> {
    let httpParams = new HttpParams().set('fragmentSetId', query.fragmentSetId);
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.get<Mt101PayConflict[]>('/api/query/mt101-fragments/pay-conflicts', { params: httpParams });
  }

  /**
   * Consola de PAY Conflicts: inbox transversal de conflictos de pago abiertos (todos los sets/ejecuciones), más
   * recientes primero. No exige conocer el fragmentSetId de antemano.
   */
  mt101OpenPayConflicts(query?: {
    connectionRef?: string;
    limit?: number;
    cursor?: string;
  }): Observable<Mt101OpenPayConflictsPage> {
    let httpParams = new HttpParams();
    if (query?.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    if (query?.limit != null) {
      httpParams = httpParams.set('limit', String(query.limit));
    }
    if (query?.cursor) {
      httpParams = httpParams.set('cursor', query.cursor);
    }
    return this.http.get<Mt101OpenPayConflictsPage>(
      '/api/query/mt101-fragments/pay-conflicts/open', { params: httpParams });
  }

  /**
   * A1 (evidencia inline): confirmación(es) del banco para un :20: (gatewayReference + último STATUS), la evidencia de
   * por qué el fragmento quedó en conflicto.
   */
  mt101PayConflictConfirmations(query: {
    connectionRef?: string;
    sendersReference: string;
    processExecutionId: number | string;
  }): Observable<Mt101OpenPayConflictConfirmation[]> {
    let httpParams = new HttpParams()
      .set('sendersReference', query.sendersReference)
      .set('processExecutionId', String(query.processExecutionId));
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.get<Mt101OpenPayConflictConfirmation[]>(
      '/api/query/mt101-fragments/pay-conflicts/confirmations', { params: httpParams });
  }

  /**
   * A2 (resolucion gobernada): reconoce un conflicto con motivo — limpia el flag y deja la trama PAY_CONFLICT_RESOLVED,
   * sin tocar el terminal real. source=NORMAL usa fragmentSetId; source=CORRECTIVE usa rebuildRunId (ambos en setId).
   * El motivo y el ticket viajan en el body JSON (no en la URL); ticketRef es obligatorio.
   */
  mt101AcknowledgePayConflict(body: {
    connectionRef?: string;
    source: 'NORMAL' | 'CORRECTIVE';
    setId: string;
    sendersReference: string;
    reason: string;
    ticketRef: string;
  }): Observable<{ acknowledged: number }> {
    return this.http.post<{ acknowledged: number }>(
      '/api/query/mt101-fragments/pay-conflicts/acknowledge',
      {
        connectionRef: body.connectionRef?.trim() || undefined,
        source: body.source,
        setId: body.setId,
        sendersReference: body.sendersReference,
        reason: body.reason,
        ticketRef: body.ticketRef,
      });
  }

  /** Config del reconocimiento de conflictos: si maker-checker está activo la UI usa el flujo de dos pasos. */
  mt101PayConflictSettings(): Observable<{ makerCheckerEnabled: boolean }> {
    return this.http.get<{ makerCheckerEnabled: boolean }>(
      '/api/query/mt101-fragments/pay-conflicts/settings');
  }

  /** Maker-checker paso 1 (maker): solicita reconocer el conflicto (no apaga la alerta). Solo con maker-checker on. */
  mt101RequestAcknowledgePayConflict(body: {
    connectionRef?: string;
    source: 'NORMAL' | 'CORRECTIVE';
    setId: string;
    sendersReference: string;
    reason: string;
    ticketRef: string;
  }): Observable<void> {
    return this.http.post<void>(
      '/api/query/mt101-fragments/pay-conflicts/request-acknowledge',
      {
        connectionRef: body.connectionRef?.trim() || undefined,
        source: body.source,
        setId: body.setId,
        sendersReference: body.sendersReference,
        reason: body.reason,
        ticketRef: body.ticketRef,
      });
  }

  /** Maker-checker paso 2 (checker, actor distinto): aprueba la solicitud pendiente -> apaga la alerta. */
  mt101ApproveAcknowledgePayConflict(body: {
    connectionRef?: string;
    source: 'NORMAL' | 'CORRECTIVE';
    setId: string;
    sendersReference: string;
  }): Observable<{ acknowledged: number }> {
    return this.http.post<{ acknowledged: number }>(
      '/api/query/mt101-fragments/pay-conflicts/approve-acknowledge',
      {
        connectionRef: body.connectionRef?.trim() || undefined,
        source: body.source,
        setId: body.setId,
        sendersReference: body.sendersReference,
      });
  }

  /**
   * v60 (gobernado): resuelve el UNCERTAIN normal del set consultando STATUS (nunca reenvía) y detecta conflictos
   * SENT→banco-REJECTED. Motivo obligatorio (evidencia).
   */
  mt101ResolveUncertainNormalPay(query: {
    connectionRef?: string;
    fragmentSetId: string;
    reason?: string;
  }): Observable<Mt101NormalPayResolution> {
    let httpParams = new HttpParams().set('fragmentSetId', query.fragmentSetId);
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    if (query.reason?.trim()) {
      httpParams = httpParams.set('reason', query.reason.trim());
    }
    return this.http.post<Mt101NormalPayResolution>(
      '/api/query/mt101-quarantine/rebuild-runs/resolve-uncertain-normal-pay', {}, { params: httpParams });
  }

  /** D1: resumen del ledger de dispatch del PAY por lista (total + conteo por estado + atascados). */
  mt101PayDispatchSummary(): Observable<Mt101PayDispatchSummary> {
    return this.http.get<Mt101PayDispatchSummary>('/api/query/mt101-pay-dispatch-intents/summary');
  }

  /** D1: intenciones de dispatch atascadas (UNCERTAIN/DISPATCHING) que exigen conciliación. */
  mt101PayDispatchStuck(limit?: number): Observable<Mt101PayDispatchIntent[]> {
    let httpParams = new HttpParams();
    if (limit != null) {
      httpParams = httpParams.set('limit', String(limit));
    }
    return this.http.get<Mt101PayDispatchIntent[]>('/api/query/mt101-pay-dispatch-intents/stuck', { params: httpParams });
  }

  /**
   * D2 (gobernado): reconcilia una intención atascada desde el terminal ya clasificado del archive. Devuelve el
   * outcome (RECONCILED / NOT_STUCK / NO_EXECUTION / NO_TERMINAL) y el nuevo estado si aplica.
   */
  mt101PayDispatchReconcile(dispatchKey: string, reason: string): Observable<Mt101PayDispatchReconcileResult> {
    const httpParams = new HttpParams().set('dispatchKey', dispatchKey).set('reason', reason);
    return this.http.post<Mt101PayDispatchReconcileResult>(
      '/api/query/mt101-pay-dispatch-intents/reconcile', {}, { params: httpParams });
  }

  /** Cabecera del lote (archivo + hash + ejecución + conteos) por set o por ejecución. */
  mt101Lote(query: { connectionRef?: string; fragmentSetId?: string; processExecutionId?: number | string }): Observable<Mt101LoteHeader> {
    let httpParams = new HttpParams();
    if (query.fragmentSetId?.trim()) {
      httpParams = httpParams.set('fragmentSetId', query.fragmentSetId.trim());
    }
    if (query.processExecutionId !== undefined && String(query.processExecutionId).trim()) {
      httpParams = httpParams.set('processExecutionId', String(query.processExecutionId).trim());
    }
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.get<Mt101LoteHeader>('/api/query/mt101-quarantine/lote', { params: httpParams });
  }

  /** Línea de tiempo E2E operacional (instantánea) de una fila del archivo. */
  mt101RowTimeline(query: {
    connectionRef?: string;
    fragmentSetId: string;
    sourceFileHash: string;
    recordNumber: number;
    stagingId: number;
  }): Observable<Mt101RowTimelineEntry[]> {
    let httpParams = new HttpParams()
      .set('fragmentSetId', query.fragmentSetId)
      .set('sourceFileHash', query.sourceFileHash.trim())
      .set('recordNumber', String(query.recordNumber))
      .set('stagingId', String(query.stagingId));
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.get<Mt101RowTimelineEntry[]>('/api/query/mt101-fragments/row-timeline', { params: httpParams });
  }

  /** Revalida/reenvia en bloque por transicion de estado (REJECTED -> BUILT, SENT -> ARCHIVED). */
  mt101ReprocessByStatus(query: {
    connectionRef?: string;
    fragmentSetId: string;
    fromStatus: string;
    toStatus: string;
    reason?: string;
    ticketRef?: string;
  }): Observable<Mt101ReprocessResult> {
    let httpParams = new HttpParams()
      .set('fragmentSetId', query.fragmentSetId)
      .set('fromStatus', query.fromStatus)
      .set('toStatus', query.toStatus);
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    if (query.reason?.trim()) {
      httpParams = httpParams.set('reason', query.reason.trim());
    }
    if (query.ticketRef?.trim()) {
      httpParams = httpParams.set('ticketRef', query.ticketRef.trim());
    }
    return this.http.post<Mt101ReprocessResult>('/api/query/mt101-fragments/reprocess/status', {}, {
      params: httpParams,
    });
  }

  /** Reprocesa solo los fragmentos que contienen las filas [recordFrom, recordTo] del archivo. */
  mt101ReprocessBySourceRows(query: {
    connectionRef?: string;
    fragmentSetId: string;
    recordFrom: number | string;
    recordTo?: number | string;
    sourceFileHash: string;
    toStatus?: string;
    reason?: string;
    ticketRef?: string;
  }): Observable<Mt101FragmentLink[]> {
    let httpParams = new HttpParams()
      .set('fragmentSetId', query.fragmentSetId)
      .set('recordFrom', String(query.recordFrom))
      .set('sourceFileHash', query.sourceFileHash.trim())
      .set('toStatus', query.toStatus ?? 'BUILT');
    if (query.recordTo !== undefined && String(query.recordTo).trim()) {
      httpParams = httpParams.set('recordTo', String(query.recordTo).trim());
    }
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    if (query.reason?.trim()) {
      httpParams = httpParams.set('reason', query.reason.trim());
    }
    if (query.ticketRef?.trim()) {
      httpParams = httpParams.set('ticketRef', query.ticketRef.trim());
    }
    return this.http.post<Mt101FragmentLink[]>('/api/query/mt101-fragments/reprocess/source-rows', {}, {
      params: httpParams,
    });
  }

  /** Lista las filas en cuarentena de un set (la fila exacta que fallo, regla, :20:/:21:). */
  mt101FailedRecords(query: {
    connectionRef?: string;
    fragmentSetId: string;
    status?: string;
    sourceFileHash?: string;
    sourceRecordNumber?: number | string;
    ruleCode?: string;
    sendersReference?: string;
    transactionReference?: string;
    afterId?: number;
    limit?: number;
  }): Observable<Mt101FailedRecord[]> {
    let httpParams = new HttpParams()
      .set('fragmentSetId', query.fragmentSetId)
      .set('limit', String(query.limit ?? 500));
    if (query.status?.trim()) {
      httpParams = httpParams.set('status', query.status.trim());
    }
    if (query.sourceFileHash?.trim()) {
      httpParams = httpParams.set('sourceFileHash', query.sourceFileHash.trim());
    }
    if (query.sourceRecordNumber !== undefined && String(query.sourceRecordNumber).trim()) {
      httpParams = httpParams.set('sourceRecordNumber', String(query.sourceRecordNumber).trim());
    }
    if (query.ruleCode?.trim()) {
      httpParams = httpParams.set('ruleCode', query.ruleCode.trim());
    }
    if (query.sendersReference?.trim()) {
      httpParams = httpParams.set('sendersReference', query.sendersReference.trim());
    }
    if (query.transactionReference?.trim()) {
      httpParams = httpParams.set('transactionReference', query.transactionReference.trim());
    }
    if (query.afterId !== undefined && query.afterId > 0) {
      httpParams = httpParams.set('afterId', String(query.afterId));
    }
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.get<Mt101FailedRecord[]>('/api/query/mt101-quarantine', { params: httpParams });
  }

  /** ADR-020 (A): resumen de la cuarentena agrupado por causa (rule_code) para un set. */
  mt101SummaryByRule(query: {
    connectionRef?: string;
    fragmentSetId: string;
    status?: string;
  }): Observable<Mt101RuleSummary[]> {
    let httpParams = new HttpParams().set('fragmentSetId', query.fragmentSetId);
    if (query.status?.trim()) {
      httpParams = httpParams.set('status', query.status.trim());
    }
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.get<Mt101RuleSummary[]>(
      '/api/query/mt101-quarantine/summary-by-rule', { params: httpParams });
  }

  /** ADR-020 (C1): descarga la planilla de correccion (XLSX) de la cuarentena de un set (opcional por causa). */
  mt101CorrectionSheet(query: {
    connectionRef?: string;
    fragmentSetId: string;
    ruleCode?: string;
    status?: string;
  }): Observable<Blob> {
    let httpParams = new HttpParams().set('fragmentSetId', query.fragmentSetId);
    if (query.ruleCode?.trim()) {
      httpParams = httpParams.set('ruleCode', query.ruleCode.trim());
    }
    if (query.status?.trim()) {
      httpParams = httpParams.set('status', query.status.trim());
    }
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.get('/api/query/mt101-quarantine/correction-sheet',
      { params: httpParams, responseType: 'blob' });
  }

  /** ADR-020 (C2): dry-run del import de la planilla — sube el XLSX (body raw) y devuelve la clasificacion. */
  mt101PreviewCorrectionSheet(query: {
    connectionRef?: string;
    fragmentSetId: string;
    file: Blob;
  }): Observable<Mt101CorrectionPreview> {
    let httpParams = new HttpParams().set('fragmentSetId', query.fragmentSetId);
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.post<Mt101CorrectionPreview>(
      '/api/query/mt101-quarantine/correction-sheet/preview',
      query.file,
      { params: httpParams, headers: { 'Content-Type': 'application/octet-stream' } });
  }

  /**
   * ADR-020 (C3): aplica la planilla — sube el XLSX (body raw) y devuelve el resultado (corregidas/omitidas/
   * fallidas + issues). Muta el payload de las filas por el camino money-safe de correctRow. reason obligatorio.
   */
  mt101ApplyCorrectionSheet(query: {
    connectionRef?: string;
    fragmentSetId: string;
    reason: string;
    ticketRef?: string;
    file: Blob;
  }): Observable<Mt101CorrectionApply> {
    let httpParams = new HttpParams()
      .set('fragmentSetId', query.fragmentSetId)
      .set('reason', query.reason.trim());
    if (query.ticketRef?.trim()) {
      httpParams = httpParams.set('ticketRef', query.ticketRef.trim());
    }
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.post<Mt101CorrectionApply>(
      '/api/query/mt101-quarantine/correction-sheet/apply',
      query.file,
      { params: httpParams, headers: { 'Content-Type': 'application/octet-stream' } });
  }

  /** Construye la cuarentena resolviendo cada :21: fallido a su fila exacta del archivo. */
  mt101BuildQuarantine(query: {
    connectionRef?: string;
    fragmentSetId: string;
    issueTable?: string;
  }): Observable<Mt101QuarantineBuildResult> {
    let httpParams = new HttpParams().set('fragmentSetId', query.fragmentSetId);
    if (query.issueTable?.trim()) {
      httpParams = httpParams.set('issueTable', query.issueTable.trim());
    }
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.post<Mt101QuarantineBuildResult>('/api/query/mt101-quarantine/build', {}, {
      params: httpParams,
    });
  }

  /** Payload actual + version (ETag) de una fila en cuarentena, para cargar antes de corregir. */
  mt101StagingRow(query: {
    connectionRef?: string;
    fragmentSetId: string;
    sourceFileHash: string;
    recordNumber: number;
    stagingId: number;
  }): Observable<Mt101StagingRowView> {
    let httpParams = new HttpParams()
      .set('fragmentSetId', query.fragmentSetId)
      .set('sourceFileHash', query.sourceFileHash.trim())
      .set('recordNumber', String(query.recordNumber))
      .set('stagingId', String(query.stagingId));
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.get<Mt101StagingRowView>(
      '/api/query/mt101-quarantine/staging-row', { params: httpParams });
  }

  /**
   * Corrige el payload de una fila fallida en staging (paso previo al rebuild). Envía la
   * versión leída en If-Match (locking optimista): un 409 indica edición concurrente.
   */
  mt101CorrectStagingRow(query: {
    connectionRef?: string;
    fragmentSetId: string;
    sourceFileHash: string;
    recordNumber: number;
    stagingId: number;
    payload: string;
    version: number;
    reason?: string;
    ticketRef?: string;
  }): Observable<{ fragmentSetId: string; recordNumber: number; updated: number; version: number }> {
    let httpParams = new HttpParams()
      .set('fragmentSetId', query.fragmentSetId)
      .set('sourceFileHash', query.sourceFileHash.trim())
      .set('recordNumber', String(query.recordNumber))
      .set('stagingId', String(query.stagingId));
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    if (query.reason?.trim()) {
      httpParams = httpParams.set('reason', query.reason.trim());
    }
    if (query.ticketRef?.trim()) {
      httpParams = httpParams.set('ticketRef', query.ticketRef.trim());
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'If-Match': `"${query.version}"` };
    return this.http.patch<{ fragmentSetId: string; recordNumber: number; updated: number; version: number }>(
      '/api/query/mt101-quarantine/staging-row', query.payload, { params: httpParams, headers });
  }

  /**
   * Paso 1 del flujo gobernado: solicita el rebuild (queda REQUESTED, sin ejecutarse).
   * El correctiveSetId lo genera el servidor (B1) y vuelve en el summary; el cliente no lo provee.
   */
  mt101RequestRebuildRun(query: {
    connectionRef?: string;
    fragmentSetId: string;
    reason?: string;
  }): Observable<Mt101RebuildRunSummary> {
    let httpParams = new HttpParams().set('fragmentSetId', query.fragmentSetId);
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    if (query.reason?.trim()) {
      httpParams = httpParams.set('reason', query.reason.trim());
    }
    return this.http.post<Mt101RebuildRunSummary>('/api/query/mt101-quarantine/rebuild-runs/request', {}, { params: httpParams });
  }

  /** Paso 2: aprueba el run. El backend exige que el aprobador sea distinto del solicitante (maker-checker). */
  mt101ApproveRebuildRun(query: { connectionRef?: string; rebuildRunId: string; reason?: string }): Observable<Mt101RebuildRunSummary> {
    let httpParams = new HttpParams().set('rebuildRunId', query.rebuildRunId);
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    if (query.reason?.trim()) {
      httpParams = httpParams.set('reason', query.reason.trim());
    }
    return this.http.post<Mt101RebuildRunSummary>('/api/query/mt101-quarantine/rebuild-runs/approve', {}, {
      params: httpParams,
    });
  }

  /** Paso 3: ejecuta el run aprobado (genera el lote correctivo y resuelve la cuarentena del run). */
  mt101ExecuteRebuildRun(query: { connectionRef?: string; rebuildRunId: string }): Observable<Mt101RebuildResult> {
    let httpParams = new HttpParams().set('rebuildRunId', query.rebuildRunId);
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.post<Mt101RebuildResult>('/api/query/mt101-quarantine/rebuild-runs/execute', {}, {
      params: httpParams,
    });
  }

  mt101RebuildRuns(query: { connectionRef?: string; fragmentSetId: string; limit?: number }): Observable<Mt101RebuildRunSummary[]> {
    let httpParams = new HttpParams()
      .set('fragmentSetId', query.fragmentSetId)
      .set('limit', String(query.limit ?? 20));
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.get<Mt101RebuildRunSummary[]>('/api/query/mt101-quarantine/rebuild-runs', { params: httpParams });
  }

  mt101RebuildRun(query: { connectionRef?: string; rebuildRunId: string }): Observable<Mt101RebuildRunSummary> {
    return this.http.get<Mt101RebuildRunSummary>('/api/query/mt101-quarantine/rebuild-runs/detail', {
      params: this.runIdParams(query.rebuildRunId, query.connectionRef),
    });
  }

  /** B2': avanza el correctivo BUILT -> VALIDATED -> ARCHIVED (sin enviar; no mueve dinero). */
  mt101AdvanceCorrective(query: { connectionRef?: string; rebuildRunId: string }): Observable<Mt101CorrectiveLifecycle> {
    return this.http.post<Mt101CorrectiveLifecycle>('/api/query/mt101-quarantine/rebuild-runs/advance-corrective', {},
      { params: this.runIdParams(query.rebuildRunId, query.connectionRef) });
  }

  /** B2': el maker solicita el envío (PAY) del correctivo, ya ARCHIVED. Motivo + ticket de negocio. */
  mt101RequestCorrectivePay(query: {
    connectionRef?: string;
    rebuildRunId: string;
    reason?: string;
    ticketRef?: string;
  }): Observable<Mt101CorrectiveLifecycle> {
    let httpParams = this.runIdParams(query.rebuildRunId, query.connectionRef);
    if (query.reason?.trim()) {
      httpParams = httpParams.set('reason', query.reason.trim());
    }
    if (query.ticketRef?.trim()) {
      httpParams = httpParams.set('ticketRef', query.ticketRef.trim());
    }
    return this.http.post<Mt101CorrectiveLifecycle>('/api/query/mt101-quarantine/rebuild-runs/request-pay', {},
      { params: httpParams });
  }

  /** B2': el checker (distinto del maker) aprueba y ejecuta el envío del correctivo (PAY real). */
  mt101ApproveCorrectivePay(query: { connectionRef?: string; rebuildRunId: string }): Observable<Mt101CorrectiveLifecycle> {
    return this.http.post<Mt101CorrectiveLifecycle>('/api/query/mt101-quarantine/rebuild-runs/approve-pay', {},
      { params: this.runIdParams(query.rebuildRunId, query.connectionRef) });
  }

  /** v24: historial append-only completo de acciones PAY del run (trazabilidad operativa). */
  mt101PayActions(query: { connectionRef?: string; rebuildRunId: string }): Observable<Mt101PayAction[]> {
    return this.http.get<Mt101PayAction[]>('/api/query/mt101-quarantine/rebuild-runs/pay-actions',
      { params: this.runIdParams(query.rebuildRunId, query.connectionRef) });
  }

  /** B2': resuelve un PAY_UNCERTAIN consultando MT101_STATUS (no reenvía). Motivo de negocio. */
  mt101ResolveUncertainPay(query: {
    connectionRef?: string;
    rebuildRunId: string;
    reason?: string;
  }): Observable<Mt101CorrectiveLifecycle> {
    let httpParams = this.runIdParams(query.rebuildRunId, query.connectionRef);
    if (query.reason?.trim()) {
      httpParams = httpParams.set('reason', query.reason.trim());
    }
    return this.http.post<Mt101CorrectiveLifecycle>('/api/query/mt101-quarantine/rebuild-runs/resolve-uncertain-pay', {},
      { params: httpParams });
  }

  private runIdParams(rebuildRunId: string, connectionRef?: string): HttpParams {
    let httpParams = new HttpParams().set('rebuildRunId', rebuildRunId);
    if (connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', connectionRef.trim());
    }
    return httpParams;
  }

  /**
   * B1': reabre una fila cuyo rebuild correctivo fue rechazado (REBUILD_REJECTED -> QUARANTINED)
   * para corregirla y reconstruir de nuevo, conservando el run y las referencias correctivas.
   */
  mt101ReopenRejected(query: {
    connectionRef?: string;
    fragmentSetId: string;
    sourceFileHash: string;
    recordNumber: number;
    stagingId: number;
    reason?: string;
  }): Observable<{ fragmentSetId: string; fromStatus: string; toStatus: string; affected: number }> {
    let httpParams = new HttpParams()
      .set('fragmentSetId', query.fragmentSetId)
      .set('sourceFileHash', query.sourceFileHash)
      .set('recordNumber', query.recordNumber)
      .set('stagingId', query.stagingId);
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    if (query.reason?.trim()) {
      httpParams = httpParams.set('reason', query.reason.trim());
    }
    return this.http.post<{ fragmentSetId: string; fromStatus: string; toStatus: string; affected: number }>(
      '/api/query/mt101-fragments/reprocess/reopen-rejected', {}, { params: httpParams });
  }

}
