import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { AuditApiService } from '../../api/audit-api.service';
import { Mt101FailedRecord } from '../../models/audit.models';
import { Mt101QuarantineComponent } from './mt101-quarantine.component';

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
  };
}

describe('Mt101QuarantineComponent', () => {
  let component: Mt101QuarantineComponent;
  let requestCalls: number;
  let approveCalls: number;
  let executeCalls: number;

  beforeEach(() => {
    requestCalls = 0;
    approveCalls = 0;
    executeCalls = 0;
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
      mt101BuildQuarantine: () => of({ fragmentSetId: 'S', quarantined: 0 }),
    } as unknown as AuditApiService;
    const route = { snapshot: { queryParamMap: { get: () => null } } } as unknown as ActivatedRoute;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuditApiService, useValue: api },
        { provide: ActivatedRoute, useValue: route },
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
  });

  describe('construir cuarentena (2-pasos)', () => {
    it('arma en el primer clic', () => {
      component.fragmentSetId = 'S';
      component.confirmBuild();
      expect(component.armed()).toBe('build');
    });
  });
});
