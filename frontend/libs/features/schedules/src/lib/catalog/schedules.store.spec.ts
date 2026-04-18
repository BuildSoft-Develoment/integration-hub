import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import {
  AppFeedbackService,
  AuthAccessService,
} from '@integration-hub/core/services';

import { SchedulesApiService } from '../api/schedules-api.service';
import { SchedulesStore } from './schedules.store';

describe('SchedulesStore', () => {
  let store: SchedulesStore;
  let list: ReturnType<typeof vi.fn>;
  let execute: ReturnType<typeof vi.fn>;
  let feedbackInfo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    list = vi.fn();
    execute = vi.fn().mockReturnValue(of({}));
    feedbackInfo = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        SchedulesStore,
        {
          provide: SchedulesApiService,
          useValue: {
            list,
            execute,
          },
        },
        {
          provide: AuthAccessService,
          useValue: {
            canOperate: () => true,
          },
        },
        {
          provide: AppFeedbackService,
          useValue: {
            info: feedbackInfo,
          },
        },
      ],
    });

    store = TestBed.inject(SchedulesStore);
  });

  it('should prevent manual schedules from being executed', async () => {
    const manualSchedule = createSchedule(1, false);

    await store.execute(manualSchedule);

    expect(execute).not.toHaveBeenCalled();
    expect(feedbackInfo).toHaveBeenCalledWith('schedules.manualExecutionBlocked');
  });

  it('should clear the selected schedule when it disappears after reload', async () => {
    const scheduledItem = createSchedule(2, true);

    list
      .mockReturnValueOnce(
        of({
          items: [scheduledItem],
          total: 1,
        })
      )
      .mockReturnValueOnce(
        of({
          items: [],
          total: 0,
        })
      );

    await store.load();
    store.selectSchedule(scheduledItem);

    store.updateStatusFilter('INACTIVE');
    await flushAsync();

    expect(store.selectedSchedule()).toBeNull();
    expect(store.drawerOpen()).toBe(false);
  });

  it('should execute scheduled items and refresh the catalog', async () => {
    const scheduledItem = createSchedule(3, true);

    list
      .mockReturnValueOnce(
        of({
          items: [scheduledItem],
          total: 1,
        })
      )
      .mockReturnValueOnce(
        of({
          items: [scheduledItem],
          total: 1,
        })
      );

    await store.load();
    await store.execute(scheduledItem);

    expect(execute).toHaveBeenCalledWith(3);
    expect(list).toHaveBeenCalledTimes(2);
    expect(feedbackInfo).toHaveBeenCalledWith('schedules.executed', { name: scheduledItem.name });
  });
});

function createSchedule(id: number, scheduled: boolean) {
  return {
    id,
    name: `Proceso ${id}`,
    description: 'Descripcion',
    active: true,
    scheduled,
    scheduleEvery: scheduled ? '0 0 * * *' : null,
    nextRunAt: scheduled ? '2026-04-17T00:00:00Z' : null,
    lastRunAt: '2026-04-16T00:00:00Z',
  };
}

async function flushAsync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
