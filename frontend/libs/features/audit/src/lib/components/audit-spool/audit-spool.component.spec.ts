import { TestBed } from '@angular/core/testing';
import { AuthAccessService } from '@integration-hub/core/services';
import { of } from 'rxjs';

import { AuditApiService } from '../../api/audit-api.service';
import { AuditSpoolEntry, AuditSpoolSummary } from '../../models/audit.models';
import { AuditSpoolComponent } from './audit-spool.component';

function summary(p: Partial<AuditSpoolSummary>): AuditSpoolSummary {
  return { pending: 0, inFlight: 0, sent: 0, dead: 0, oldestPendingCreatedAt: null, ...p };
}

describe('AuditSpoolComponent', () => {
  let component: AuditSpoolComponent;
  let cleanupCalls: number;
  let retryCalls: number;
  let canAuditAdmin: boolean;

  beforeEach(() => {
    cleanupCalls = 0;
    retryCalls = 0;
    canAuditAdmin = true;
    const api = {
      auditSpoolSummary: () => of(summary({})),
      auditSpoolDead: () => of([] as AuditSpoolEntry[]),
      cleanupAuditSpoolSent: () => {
        cleanupCalls++;
        return of({ deleted: 3 });
      },
      retryAuditSpool: () => {
        retryCalls++;
        return of(void 0);
      },
    } as unknown as AuditApiService;
    const access = {
      canAuditAdmin: () => canAuditAdmin,
    } as unknown as AuthAccessService;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuditApiService, useValue: api },
        { provide: AuthAccessService, useValue: access },
      ],
    });
    component = TestBed.runInInjectionContext(() => new AuditSpoolComponent());
  });

  describe('semáforo de salud', () => {
    it('es null sin summary cargado', () => {
      expect(component.health()).toBeNull();
    });

    it('es error cuando hay eventos DEAD', () => {
      component.summary.set(summary({ dead: 5 }));
      expect(component.health()).toBe('error');
      expect(component.healthLabel()).toContain('atencion');
    });

    it('es warn cuando la cola está estancada (>5min)', () => {
      const stale = new Date(Date.now() - 6 * 60_000).toISOString();
      component.summary.set(summary({ pending: 2, oldestPendingCreatedAt: stale }));
      expect(component.health()).toBe('warn');
    });

    it('es ok cuando no hay pendientes ni dead-letter', () => {
      component.summary.set(summary({ sent: 1842 }));
      expect(component.health()).toBe('ok');
      expect(component.healthLabel()).toContain('sana');
    });

    it('no alarma con pendientes recientes (cola trabajando)', () => {
      const fresh = new Date().toISOString();
      component.summary.set(summary({ pending: 10, inFlight: 3, oldestPendingCreatedAt: fresh }));
      expect(component.health()).toBeNull();
    });
  });

  describe('confirmación 2-pasos', () => {
    it('expone riesgo operativo de cleanup/retry con permiso admin', () => {
      expect(component.cleanupRisk.requiredCapability).toBe('audit-admin');
      expect(component.cleanupRisk.evidence).toContain('two-step-confirmation');
      expect(component.retryRisk.requiredCapability).toBe('audit-admin');
    });

    it('el primer clic en limpiar arma sin ejecutar', () => {
      component.confirmCleanup();
      expect(component.actions.armed()).toBe('spool:cleanup');
      expect(cleanupCalls).toBe(0);
    });

    it('el segundo clic ejecuta y desarma', () => {
      component.confirmCleanup();
      component.confirmCleanup();
      expect(cleanupCalls).toBe(1);
      expect(component.actions.armed()).toBeNull();
    });

    it('el retry se arma por id de fila (no afecta a otras)', () => {
      const row = { id: 42 } as AuditSpoolEntry;
      component.confirmRetry(row);
      expect(component.actions.armed()).toBe('spool:retry:42');
      expect(retryCalls).toBe(0);
      component.confirmRetry(row);
      expect(retryCalls).toBe(1);
      expect(component.actions.armed()).toBeNull();
    });

    it('no arma acciones destructivas sin permiso admin', () => {
      canAuditAdmin = false;
      component.confirmCleanup();
      component.confirmRetry({ id: 42 } as AuditSpoolEntry);
      expect(component.actions.armed()).toBeNull();
      expect(cleanupCalls).toBe(0);
      expect(retryCalls).toBe(0);
    });
  });

  describe('auto-refresh', () => {
    it('alterna el flag y limpia sin lanzar en destroy', () => {
      component.setAutoRefresh(true);
      expect(component.autoRefresh()).toBe(true);
      component.setRefreshMs(60000);
      expect(component.refreshMs()).toBe(60000);
      component.setAutoRefresh(false);
      expect(component.autoRefresh()).toBe(false);
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
