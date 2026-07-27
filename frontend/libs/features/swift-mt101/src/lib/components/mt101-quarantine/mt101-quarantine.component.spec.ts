import { TestBed } from '@angular/core/testing';
import { AuthAccessService } from '@integration-hub/core/services';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { Mt101AuditApiService } from '../../api/mt101-audit-api.service';
import { Mt101FailedRecord } from '../../models/mt101.models';
import { Mt101QuarantineComponent } from './mt101-quarantine.component';
import { Mt101CorrectionSheetFlowService } from '../../services/mt101-correction-sheet-flow.service';

function failed(p: Partial<Mt101FailedRecord>): Mt101FailedRecord {
  return {
    id: 1,
    fragmentSetId: 'S',
    sendersReference: null,
    transactionReference: null,
    sourceFileHash: null,
    sourceRecordNumber: null,
    ruleCode: null,
    ruleSet: null,
    severity: null,
    message: null,
    status: 'QUARANTINED',
    createdAt: null,
    resolvedAt: null,
    ...p,
    stagingId: p.stagingId ?? null,
    sourceTaskDefinitionId: p.sourceTaskDefinitionId ?? null,
    sourceName: p.sourceName ?? null,
  };
}

describe('Mt101QuarantineComponent', () => {
  let component: Mt101QuarantineComponent;
  let requestCalls: number;
  let approveCalls: number;
  let executeCalls: number;
  let correctCalls: number;
  let lastCorrectionVersion: number | undefined;
  let canAuditAdmin: boolean;
  let canAuditOperate: boolean;
  let normalPayCalls: string[];

  beforeEach(() => {
    requestCalls = 0;
    approveCalls = 0;
    executeCalls = 0;
    correctCalls = 0;
    lastCorrectionVersion = undefined;
    canAuditAdmin = true;
    canAuditOperate = true;
    normalPayCalls = [];
    const api = {
      mt101RequestRebuildRun: () => {
        requestCalls++;
        return of({ rebuildRunId: 'S-FIX', originalFragmentSetId: 'S', correctiveSetId: 'S-FIX', status: 'REQUESTED', selectedRows: 50, affectedFragments: 1 });
      },
      mt101ApproveRebuildRun: () => {
        approveCalls++;
        return of({ rebuildRunId: 'S-FIX', originalFragmentSetId: 'S', correctiveSetId: 'S-FIX', status: 'APPROVED', selectedRows: 50, affectedFragments: 1 });
      },
      mt101ExecuteRebuildRun: () => {
        executeCalls++;
        return of({ rebuildRunId: 'S-FIX', correctiveSetId: 'S-FIX', fragmentCount: 1, rebuiltRows: 50, supersededFragments: 1, resolvedQuarantine: 1 });
      },
      mt101FragmentSetSummary: () => of({ fragmentSetId: 'S', total: 0, byStatus: {} }),
      mt101FailedRecords: () => of([] as Mt101FailedRecord[]),
      // ADR-020 (A): el resumen por causa se carga junto con la lista; sin stub, list() reventaba
      // como unhandled error dentro de los subscribe de rebuild/correctivo.
      mt101SummaryByRule: () => of([]),
      mt101BuildQuarantine: () => of({ fragmentSetId: 'S', quarantined: 0 }),
      mt101RebuildRuns: () => of([]),
      mt101StagingRow: () => of({
        fragmentSetId: 'S',
        sourceFileHash: 'hashA',
        recordNumber: 25,
        stagingId: 10025,
        payloadJson: '{"cargos":"BAD"}',
        version: 7,
      }),
      mt101CorrectStagingRow: (query: { version: number }) => {
        correctCalls++;
        lastCorrectionVersion = query.version;
        return of({ fragmentSetId: 'S', recordNumber: 25, updated: 1, version: 8 });
      },
      // v60: operaciones del PAY normal
      mt101PayConflicts: () => of([
        { sendersReference: 'K1', status: 'SENT', reason: 'bank REJECTED over a SENT', updatedAt: '2026-07-08' },
      ]),
      mt101ResolveUncertainNormalPay: (query: { reason?: string }) => {
        normalPayCalls.push(query.reason ?? '');
        return of({ resolvedSent: 2, resolvedRejected: 1, stillPending: 0, gatewayErrors: 0, conflicts: 1 });
      },
    } as unknown as Mt101AuditApiService;
    const route = { snapshot: { queryParamMap: { get: () => null } } } as unknown as ActivatedRoute;
    const access = {
      canAuditAdmin: () => canAuditAdmin,
      canAuditOperate: () => canAuditOperate,
    } as unknown as AuthAccessService;

    TestBed.configureTestingModule({
      providers: [
        { provide: Mt101AuditApiService, useValue: api },
        { provide: ActivatedRoute, useValue: route },
        { provide: AuthAccessService, useValue: access },
        // El componente lo declara en su propio `providers`, pero el spec lo instancia a mano
        // (runInInjectionContext usa el injector raiz del TestBed, no el del nodo del componente).
        Mt101CorrectionSheetFlowService,
      ],
    });
    component = TestBed.runInInjectionContext(() => new Mt101QuarantineComponent());
  });

  describe('conteo de cuarentena', () => {
    it('pendingCount cuenta solo las filas QUARANTINED', () => {
      component.rows.set([
        failed({ id: 1, sourceRecordNumber: 137, status: 'QUARANTINED' }),
        failed({ id: 2, sourceRecordNumber: 8472, status: 'QUARANTINED' }),
        failed({ id: 3, sourceRecordNumber: 8480, status: 'REBUILD_PENDING_VALIDATION' }),
      ]);
      expect(component.pendingCount()).toBe(2);
    });
  });

  describe('flujo gobernado del rebuild (maker-checker)', () => {
    it('expone riesgos operativos para rebuild y PAY', () => {
      expect(component.governedRisks.map((risk) => risk.id)).toContain('mt101-rebuild-approve');
      expect(component.governedRisks.map((risk) => risk.id)).toContain('mt101-corrective-pay-approve');
      expect(component.executeRisk.severity).toBe('critical');
      expect(component.correctionRisk.evidence).toContain('optimistic-lock');
    });

    it('requestRebuild crea el run REQUESTED sin ejecutar', () => {
      component.fragmentSetId = 'S';
      component.requestRebuild();
      expect(component.rebuildRun()?.status).toBe('REQUESTED');
      // B1: el correctiveSetId lo genera el servidor y vuelve en el summary.
      expect(component.rebuildRun()?.correctiveSetId).toBe('S-FIX');
      expect(requestCalls).toBe(1);
      expect(executeCalls).toBe(0);
    });

    it('no solicita sin fragmentSetId', () => {
      component.fragmentSetId = '';
      component.requestRebuild();
      expect(component.rebuildRun()).toBeNull();
      expect(requestCalls).toBe(0);
    });

    it('aprobar pasa a APPROVED; ejecutar reconstruye y limpia el run', () => {
      component.fragmentSetId = 'S';
      component.requestRebuild();
      component.approveRun();
      expect(component.rebuildRun()?.status).toBe('APPROVED');
      expect(approveCalls).toBe(1);
      component.executeRun();
      expect(executeCalls).toBe(1);
      expect(component.rebuildRun()).toBeNull();
    });

    it('cancelar limpia el run sin ejecutar', () => {
      component.fragmentSetId = 'S';
      component.requestRebuild();
      component.cancelRebuild();
      expect(component.rebuildRun()).toBeNull();
      expect(executeCalls).toBe(0);
    });

    it('no solicita ni aprueba sin la capacidad requerida', () => {
      component.fragmentSetId = 'S';

      canAuditOperate = false;
      component.requestRebuild();
      expect(requestCalls).toBe(0);

      canAuditOperate = true;
      component.requestRebuild();
      canAuditAdmin = false;
      component.approveRun();
      expect(approveCalls).toBe(0);
    });
  });

  describe('v60: operaciones del PAY normal', () => {
    it('loadPayConflicts carga la lista detallada de conflictos', () => {
      component.fragmentSetId = 'S';
      component.loadPayConflicts();
      expect(component.payConflictsShown()).toBe(true);
      expect(component.payConflicts().length).toBe(1);
      expect(component.payConflicts()[0].sendersReference).toBe('K1');
    });

    it('resolveNormalUncertainPay exige motivo: sin motivo no llama al backend', () => {
      component.fragmentSetId = 'S';
      component.payResolutionReason = '   ';
      component.resolveNormalUncertainPay();
      expect(normalPayCalls).toEqual([]);
      expect(component.error()).toBeTruthy();
    });

    it('resolveNormalUncertainPay con motivo llama al backend y muestra el resultado', () => {
      component.fragmentSetId = 'S';
      component.payResolutionReason = 'conciliar tras STATUS';
      component.resolveNormalUncertainPay();
      expect(normalPayCalls).toEqual(['conciliar tras STATUS']);
      expect(component.message()).toContain('2');
    });

    it('no resuelve sin la capacidad de operar', () => {
      component.fragmentSetId = 'S';
      component.payResolutionReason = 'x';
      canAuditOperate = false;
      component.resolveNormalUncertainPay();
      expect(normalPayCalls).toEqual([]);
    });
  });

  describe('construir cuarentena (2-pasos)', () => {
    it('arma en el primer clic', () => {
      component.fragmentSetId = 'S';
      component.confirmBuild();
      expect(component.actions.armed()).toBe('quarantine:build');
    });
  });

  describe('correccion de staging con If-Match', () => {
    it('no guarda si no se cargo version ETag', () => {
      component.fragmentSetId = 'S';
      component.correctionPayload = '{"cargos":"OUR"}';
      component.correctionVersion.set(null);

      component.saveCorrection(failed({
        id: 1,
        sourceFileHash: 'hashA',
        sourceRecordNumber: 25,
        stagingId: 10025,
      }));

      expect(correctCalls).toBe(0);
    });

    it('envia la version cargada al guardar (modo avanzado / JSON crudo)', () => {
      component.fragmentSetId = 'S';
      component.correctionAdvanced.set(true);
      component.correctionPayload = '{"cargos":"OUR"}';
      component.correctionVersion.set(7);

      component.saveCorrection(failed({
        id: 1,
        sourceFileHash: 'hashA',
        sourceRecordNumber: 25,
        stagingId: 10025,
      }));

      expect(correctCalls).toBe(1);
      expect(lastCorrectionVersion).toBe(7);
    });

    it('en modo campos envia solo los campos editados y respeta el If-Match', () => {
      component.fragmentSetId = 'S';
      component.correctionVersion.set(7);
      // Editor 1-a-1: el modo por defecto arma un merge-patch con SOLO lo que cambio.
      component.correctionAdvanced.set(false);
      component.correctionEditableKeys.set(['cargos', 'moneda']);
      component.correctionEdits = { cargos: 'OUR', moneda: 'PEN' };

      component.saveCorrection(failed({
        id: 1,
        sourceFileHash: 'hashA',
        sourceRecordNumber: 25,
        stagingId: 10025,
      }));

      expect(correctCalls).toBe(1);
      expect(lastCorrectionVersion).toBe(7);
    });

    it('en modo campos no llama al backend si no se edito nada (patch vacio)', () => {
      component.fragmentSetId = 'S';
      component.correctionVersion.set(7);
      component.correctionAdvanced.set(false);
      component.correctionEditableKeys.set([]);
      component.correctionEdits = {};

      component.saveCorrection(failed({
        id: 1,
        sourceFileHash: 'hashA',
        sourceRecordNumber: 25,
        stagingId: 10025,
      }));

      expect(correctCalls).toBe(0);
    });
  });
});
