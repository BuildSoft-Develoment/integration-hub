import { TestBed } from '@angular/core/testing';
import { AuthAccessService } from '@integration-hub/core/services';
import { of } from 'rxjs';

import { AsyncDlqApiService } from '../../api/async-dlq-api.service';
import { DeadTask, DlqSummary, StalledScatter } from '../../models/async-dlq.models';
import { AsyncDlqComponent } from './async-dlq.component';

function summary(p: Partial<DlqSummary>): DlqSummary {
  return { outboxDead: 0, inboxDead: 0, inboxPoison: 0, ...p };
}

function stalled(p: Partial<StalledScatter>): StalledScatter {
  return { processExecutionId: 10, taskDefinitionId: 11, completed: 5, failed: 0, lastPageIndex: 2, lastProgressAt: null, ...p };
}

describe('AsyncDlqComponent', () => {
  let component: AsyncDlqComponent;
  let redriveCalls: number;
  let requeueArgs: Array<[number, number]>;
  let canAdmin: boolean;

  beforeEach(() => {
    redriveCalls = 0;
    requeueArgs = [];
    canAdmin = true;
    const api = {
      summary: () => of(summary({})),
      dead: () => of([] as DeadTask[]),
      stalled: () => of([] as StalledScatter[]),
      redriveOutbox: () => {
        redriveCalls++;
        return of({ redriven: 4 });
      },
      requeue: (pe: number, td: number) => {
        requeueArgs.push([pe, td]);
        return of({ requeued: true });
      },
    } as unknown as AsyncDlqApiService;
    const access = { canAdmin: () => canAdmin } as unknown as AuthAccessService;

    TestBed.configureTestingModule({
      providers: [
        { provide: AsyncDlqApiService, useValue: api },
        { provide: AuthAccessService, useValue: access },
      ],
    });
    component = TestBed.runInInjectionContext(() => new AsyncDlqComponent());
  });

  describe('semáforo de salud', () => {
    it('es null sin summary cargado', () => {
      expect(component.health()).toBeNull();
    });

    it('es error cuando hay filas muertas (outbox/inbox/poison)', () => {
      component.summary.set(summary({ inboxPoison: 2 }));
      expect(component.health()).toBe('error');
    });

    it('es warn cuando hay scatters estancados y nada muerto', () => {
      component.summary.set(summary({}));
      component.stalledRows.set([stalled({})]);
      expect(component.health()).toBe('warn');
    });

    it('es ok cuando todo está limpio', () => {
      component.summary.set(summary({}));
      expect(component.health()).toBe('ok');
    });

    it('prioriza error sobre estancados', () => {
      component.summary.set(summary({ outboxDead: 1 }));
      component.stalledRows.set([stalled({})]);
      expect(component.health()).toBe('error');
    });
  });

  describe('confirmación 2-pasos', () => {
    it('el primer clic en redrive arma sin ejecutar', () => {
      component.confirmRedrive();
      expect(component.actions.armed()).toBe('dlq:redrive');
      expect(redriveCalls).toBe(0);
    });

    it('el segundo clic ejecuta el redrive y desarma', () => {
      component.confirmRedrive();
      component.confirmRedrive();
      expect(redriveCalls).toBe(1);
      expect(component.actions.armed()).toBeNull();
    });

    it('el requeue se arma por (ejecución, tarea) sin afectar otras filas', () => {
      const row = stalled({ processExecutionId: 70, taskDefinitionId: 72 });
      component.confirmRequeue(row);
      expect(component.actions.armed()).toBe('dlq:requeue:70:72');
      expect(requeueArgs.length).toBe(0);
      component.confirmRequeue(row);
      expect(requeueArgs).toEqual([[70, 72]]);
      expect(component.actions.armed()).toBeNull();
    });

    it('no arma acciones mutantes sin permiso admin', () => {
      canAdmin = false;
      component.confirmRedrive();
      component.confirmRequeue(stalled({}));
      expect(component.actions.armed()).toBeNull();
      expect(redriveCalls).toBe(0);
      expect(requeueArgs.length).toBe(0);
    });
  });

  describe('carga', () => {
    it('puebla summary, dead y stalled', () => {
      component.load();
      expect(component.summary()).not.toBeNull();
      expect(component.deadRows()).toEqual([]);
      expect(component.stalledRows()).toEqual([]);
      expect(component.lastRefresh()).not.toBeNull();
    });
  });

  describe('auto-refresh', () => {
    it('alterna el flag y limpia sin lanzar en destroy', () => {
      component.setAutoRefresh(true);
      expect(component.autoRefresh()).toBe(true);
      component.setRefreshMs(60000);
      expect(component.refreshMs()).toBe(60000);
      component.setAutoRefresh(false);
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
