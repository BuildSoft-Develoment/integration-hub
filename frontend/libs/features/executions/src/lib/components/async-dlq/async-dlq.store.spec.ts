import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AsyncDlqApiService } from '../../api/async-dlq-api.service';
import { DeadTask, DlqSummary, StalledScatter } from '../../models/async-dlq.models';
import { AsyncDlqStore } from './async-dlq.store';

function summary(p: Partial<DlqSummary>): DlqSummary {
  return { outboxDead: 0, inboxDead: 0, inboxPoison: 0, ...p };
}
function stalled(p: Partial<StalledScatter>): StalledScatter {
  return { processExecutionId: 10, taskDefinitionId: 11, completed: 5, failed: 0, lastPageIndex: 2, lastProgressAt: null, ...p };
}

describe('AsyncDlqStore', () => {
  let store: AsyncDlqStore;
  let redriveCalls: number;
  let requeueArgs: Array<[number, number]>;
  let deadArg: number | undefined;

  beforeEach(() => {
    redriveCalls = 0;
    requeueArgs = [];
    const api = {
      summary: () => of(summary({ inboxDead: 1 })),
      dead: (limit: number) => {
        deadArg = limit;
        return of([{ id: 1 } as DeadTask]);
      },
      stalled: () => of([stalled({})]),
      redriveOutbox: () => {
        redriveCalls++;
        return of({ redriven: 4 });
      },
      requeue: (pe: number, td: number) => {
        requeueArgs.push([pe, td]);
        return of({ requeued: true });
      },
    } as unknown as AsyncDlqApiService;

    TestBed.configureTestingModule({
      providers: [AsyncDlqStore, { provide: AsyncDlqApiService, useValue: api }],
    });
    store = TestBed.inject(AsyncDlqStore);
  });

  describe('semáforo de salud', () => {
    it('es null sin summary', () => {
      expect(store.health()).toBeNull();
    });
    it('error con filas muertas', () => {
      store.summary.set(summary({ inboxPoison: 2 }));
      expect(store.health()).toBe('error');
    });
    it('warn con estancados y nada muerto', () => {
      store.summary.set(summary({}));
      store.stalledRows.set([stalled({})]);
      expect(store.health()).toBe('warn');
    });
    it('ok cuando está limpio', () => {
      store.summary.set(summary({}));
      expect(store.health()).toBe('ok');
    });
  });

  it('load puebla summary/dead/stalled y pasa el límite', () => {
    store.load(50, 5);
    expect(deadArg).toBe(50);
    expect(store.summary()?.inboxDead).toBe(1);
    expect(store.deadRows()).toHaveLength(1);
    expect(store.stalledRows()).toHaveLength(1);
    expect(store.lastRefresh()).not.toBeNull();
  });

  it('redrive llama al endpoint y recarga', () => {
    store.redrive(100, 5);
    expect(redriveCalls).toBe(1);
    expect(store.message()).toContain('4'); // 4 reanimadas
    expect(store.summary()).not.toBeNull(); // recargó
  });

  it('requeue llama con (pe, td) y recarga', () => {
    store.requeue(stalled({ processExecutionId: 70, taskDefinitionId: 72 }), 100, 5);
    expect(requeueArgs).toEqual([[70, 72]]);
    expect(store.summary()).not.toBeNull();
  });
});
