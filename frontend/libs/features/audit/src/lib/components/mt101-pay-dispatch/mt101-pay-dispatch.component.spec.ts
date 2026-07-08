import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuditApiService } from '../../api/audit-api.service';
import { Mt101PayDispatchIntent, Mt101PayDispatchSummary } from '../../models/audit.models';
import { Mt101PayDispatchComponent } from './mt101-pay-dispatch.component';

function build(summary: Mt101PayDispatchSummary, stuck: Mt101PayDispatchIntent[]): Mt101PayDispatchComponent {
  const api = {
    mt101PayDispatchSummary: () => of(summary),
    mt101PayDispatchStuck: () => of(stuck),
  } as unknown as AuditApiService;
  TestBed.configureTestingModule({
    providers: [{ provide: AuditApiService, useValue: api }],
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
    expect(c.loading()).toBe(false);
    expect(c.error()).toBeNull();
  });

  it('sin atascados: lista vacía, sin error', () => {
    const c = build({ total: 2, byStatus: { SENT: 2 }, stuck: 0 }, []);
    expect(c.summary()?.stuck).toBe(0);
    expect(c.stuck()).toEqual([]);
    expect(c.error()).toBeNull();
  });
});
