import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuditApiService } from '../api/audit-api.service';
import { AuditStore } from './audit.store';

describe('AuditStore', () => {
  let store: AuditStore;
  let list: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    list = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        AuditStore,
        {
          provide: AuditApiService,
          useValue: {
            list,
          },
        },
      ],
    });

    store = TestBed.inject(AuditStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should clear the selected event when the refreshed result no longer contains it', async () => {
    const selectedEvent = createAuditEvent(1);

    list
      .mockReturnValueOnce(
        of({
          items: [selectedEvent],
          total: 1,
          eventTypeOptions: ['PROCESS_EXECUTION_STARTED'],
        })
      )
      .mockReturnValueOnce(
        of({
          items: [],
          total: 0,
          eventTypeOptions: ['PROCESS_EXECUTION_STARTED'],
        })
      );

    await store.load();
    store.selectEvent(selectedEvent);

    store.updateStatusFilter('FAILED');
    await flushAsync();

    expect(store.selectedEvent()).toBeNull();
    expect(store.drawerOpen()).toBe(false);
  });

  it('should debounce search reloads', async () => {
    vi.useFakeTimers();
    list.mockReturnValue(
      of({
        items: [],
        total: 0,
        eventTypeOptions: [],
      })
    );

    store.updateSearch('error');
    store.updateSearch('error final');

    expect(list).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(299);
    expect(list).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    expect(list).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledWith({
      search: 'error final',
      eventType: 'ALL',
      status: 'ALL',
      page: 0,
      size: 8,
    });
  });
});

function createAuditEvent(id: number) {
  return {
    id,
    processExecutionId: 100 + id,
    processDefinitionId: 200 + id,
    sourceExecutionId: null,
    triggerSource: null,
    taskDefinitionId: null,
    taskType: null,
    eventType: 'PROCESS_EXECUTION_STARTED',
    status: 'RUNNING',
    message: 'Proceso iniciado',
    payloadJson: null,
    createdAt: '2026-04-16T00:00:00Z',
    processedFiles: [],
  };
}

async function flushAsync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
