import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { OverviewApiService } from '../api/overview-api.service';
import { OverviewStore } from './overview.store';

describe('OverviewStore', () => {
  let store: OverviewStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OverviewStore,
        {
          provide: OverviewApiService,
          useValue: {
            getSummary: () =>
              of({
                sources: { total: 5, active: 4 },
                readers: { total: 4, active: 3 },
                processes: { total: 6, active: 5 },
                scheduledProcesses: 2,
                runningExecutions: 3,
                failedExecutions: 1,
                completedWithErrorsExecutions: 2,
                retryExecutions: 1,
                failedProcessedFiles: 7,
                pendingProcessedFiles: 9,
                recentExecutions: [
                  {
                    id: 11,
                    processDefinitionId: 101,
                    processName: 'Carga diaria',
                    status: 'RUNNING',
                    startedAt: '2026-04-16T00:00:00Z',
                    finishedAt: null,
                  },
                ],
                recentAuditEvents: [
                  {
                    id: 21,
                    processExecutionId: 11,
                    eventType: 'PROCESS_EXECUTION_STARTED',
                    status: 'RUNNING',
                    message: 'Proceso iniciado',
                    createdAt: '2026-04-16T00:01:00Z',
                  },
                ],
                failedExecutionHighlights: [
                  {
                    id: 31,
                    processDefinitionId: 102,
                    processName: 'Carga nocturna',
                    status: 'FAILED',
                    startedAt: '2026-04-15T23:00:00Z',
                    finishedAt: '2026-04-15T23:10:00Z',
                  },
                ],
              }),
          },
        },
      ],
    });

    store = TestBed.inject(OverviewStore);
  });

  it('should load the summary and expose mapped metric cards', async () => {
    await store.load();

    expect(store.summary()?.sources.total).toBe(5);
    expect(store.metrics()).toEqual([
      { key: 'sources', titleKey: 'overview.metric.sources', value: 5, detail: 4 },
      { key: 'readers', titleKey: 'overview.metric.readers', value: 4, detail: 3 },
      { key: 'processes', titleKey: 'overview.metric.processes', value: 6, detail: 5 },
      { key: 'running', titleKey: 'overview.metric.running', value: 3, detail: 1 },
      { key: 'retry', titleKey: 'overview.metric.retries', value: 1, detail: 2 },
      { key: 'files', titleKey: 'overview.metric.fileHealth', value: 7, detail: 9 },
      { key: 'scheduled', titleKey: 'overview.metric.scheduled', value: 2, detail: null },
    ]);
  });

  it('should expose recent rows for cards', async () => {
    await store.load();

    expect(store.recentExecutionsRows()).toEqual([
      {
        primary: 'Carga diaria',
        secondary: '#11',
        status: 'RUNNING',
        timestamp: '2026-04-16T00:00:00Z',
      },
    ]);
    expect(store.recentAuditRows()).toEqual([
      {
        primary: 'PROCESS_EXECUTION_STARTED',
        secondary: 'Proceso iniciado',
        status: 'RUNNING',
        timestamp: '2026-04-16T00:01:00Z',
      },
    ]);
  });
});
