import { TestBed } from '@angular/core/testing';
import { AuthAccessService } from '@integration-hub/core/services';
import { of } from 'rxjs';

import { AuditApiService } from '../../api/audit-api.service';
import {
  Mt101PayDispatchIntent,
  Mt101PayDispatchReconcileResult,
  Mt101PayDispatchSummary,
} from '../../models/audit.models';
import { Mt101PayDispatchComponent } from './mt101-pay-dispatch.component';

interface Overrides {
  reconcile?: Mt101PayDispatchReconcileResult;
  canOperate?: boolean;
  reconcileCalls?: string[];
}

function build(summary: Mt101PayDispatchSummary, stuck: Mt101PayDispatchIntent[], o: Overrides = {}): Mt101PayDispatchComponent {
  const api = {
    mt101PayDispatchSummary: () => of(summary),
    mt101PayDispatchStuck: () => of(stuck),
    mt101PayDispatchReconcile: (dispatchKey: string, reason: string) => {
      o.reconcileCalls?.push(`${dispatchKey}|${reason}`);
      return of(o.reconcile ?? { outcome: 'RECONCILED', newStatus: 'SENT' });
    },
  } as unknown as AuditApiService;
  const access = { canAuditOperate: () => o.canOperate ?? true } as unknown as AuthAccessService;
  TestBed.configureTestingModule({
    providers: [
      { provide: AuditApiService, useValue: api },
      { provide: AuthAccessService, useValue: access },
    ],
  });
  return TestBed.runInInjectionContext(() => new Mt101PayDispatchComponent());
}

function intent(p: Partial<Mt101PayDispatchIntent>): Mt101PayDispatchIntent {
  return {
    dispatchKey: 'REST|12|R1',
    processExecutionId: 7,
    sendersReference: 'R1',
    status: 'UNCERTAIN',
    gatewayReference: null,
    attempts: 1,
    errorMessage: 'timeout tras posible recepción',
    createdAt: null,
    updatedAt: null,
    ...p,
  };
}

describe('Mt101PayDispatchComponent', () => {
  it('carga resumen + atascados en init y expone el desglose por estado', () => {
    const c = build(
      { total: 5, byStatus: { SENT: 3, UNCERTAIN: 1, DISPATCHING: 1 }, stuck: 2 },
      [intent({}), intent({ dispatchKey: 'REST|12|R2', sendersReference: 'R2', status: 'DISPATCHING', errorMessage: null })],
    );
    expect(c.summary()?.stuck).toBe(2);
    expect(c.stuck().length).toBe(2);
    expect(c.statusEntries().find((e) => e.status === 'UNCERTAIN')?.count).toBe(1);
    expect(c.error()).toBeNull();
  });

  it('sin atascados: lista vacía, sin error', () => {
    const c = build({ total: 2, byStatus: { SENT: 2 }, stuck: 0 }, []);
    expect(c.summary()?.stuck).toBe(0);
    expect(c.stuck()).toEqual([]);
  });

  it('reconcile exige motivo: sin motivo no llama al backend', () => {
    const calls: string[] = [];
    const c = build({ total: 1, byStatus: { UNCERTAIN: 1 }, stuck: 1 }, [intent({})], { reconcileCalls: calls });
    c.reason = '   ';
    c.reconcile(c.stuck()[0]);
    expect(calls).toEqual([]);
  });

  it('reconcile RECONCILED: llama al backend con motivo y muestra éxito', () => {
    const calls: string[] = [];
    const c = build({ total: 1, byStatus: { UNCERTAIN: 1 }, stuck: 1 }, [intent({})],
      { reconcile: { outcome: 'RECONCILED', newStatus: 'SENT' }, reconcileCalls: calls });
    c.reason = 'confirmado por STATUS';
    c.reconcile(c.stuck()[0]);
    expect(calls).toEqual(['REST|12|R1|confirmado por STATUS']);
    expect(c.message()).toContain('R1');
    expect(c.reconciling()).toBeNull();
  });

  it('reconcile NO_TERMINAL: no-op con mensaje explicativo', () => {
    const c = build({ total: 1, byStatus: { UNCERTAIN: 1 }, stuck: 1 }, [intent({})],
      { reconcile: { outcome: 'NO_TERMINAL', newStatus: null } });
    c.reason = 'intento';
    c.reconcile(c.stuck()[0]);
    expect(c.message()).toBeTruthy();
  });
});
