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
                asyncDeadLetters: 2,
                asyncStalledScatters: 1,
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
            getPluginDiagnostics: () =>
              of({
                installed: [
                  { id: 'a', status: 'ACTIVE' },
                  { id: 'b', status: 'DEGRADED' },
                  { id: 'c', status: 'ACTIVE' },
                ],
              }),
            getPluginCanaryMetrics: () =>
              of([
                { pluginId: 'a', version: '1.0.0', promotable: true },
                { pluginId: 'c', version: '2.0.0', promotable: false },
              ]),
          },
        },
      ],
    });

    store = TestBed.inject(OverviewStore);
  });

  it('exposes inventory KPIs (count + active, no alerts)', async () => {
    await store.load();

    expect(store.inventory()).toEqual([
      { key: 'sources', titleKey: 'overview.metric.sources', value: 5, activeCount: 4 },
      { key: 'readers', titleKey: 'overview.metric.readers', value: 4, activeCount: 3 },
      { key: 'processes', titleKey: 'overview.metric.processes', value: 6, activeCount: 5 },
      { key: 'scheduled', titleKey: 'overview.metric.scheduled', value: 2, activeCount: null },
    ]);
  });

  it('maps count-based health signals with severity and facets', async () => {
    await store.load();
    const byKey = (k: string) => store.healthPrimary().find((s) => s.key === k);

    // failedExecutions=1 -> executions crítico, con las dos facetas
    expect(byKey('executions')?.alert).toBe('error');
    expect(byKey('executions')?.stats).toEqual([
      { labelKey: 'overview.exec.running', value: 3, tone: 'ok' },
      { labelKey: 'overview.exec.failed', value: 1, tone: 'error' },
    ]);
    expect(byKey('executions')?.linkRoute).toEqual(['/executions']);

    // retryExecutions=1 o completedWithErrors=2 -> atención (nueva regla)
    expect(byKey('retries')?.alert).toBe('warn');
    expect(byKey('retries')?.stats).toEqual([
      { labelKey: 'overview.retries.count', value: 1, tone: 'ok' },
      { labelKey: 'overview.retries.withErrors', value: 2, tone: 'warn' },
    ]);

    // failedProcessedFiles=7 -> archivos crítico con enlace a auditoría
    expect(byKey('files')?.alert).toBe('error');
    expect(byKey('files')?.linkRoute).toEqual(['/audit']);
  });

  it('retries stays clear only when there are no retries nor errored executions', () => {
    // Sin summary aún → no hay señales.
    expect(store.healthPrimary()).toEqual([]);
  });

  it('maps composite health signals (plugins + async) from their sources', async () => {
    await store.load();
    const byKey = (k: string) => store.healthComposite().find((s) => s.key === k);

    // installed: 2 ACTIVE + 1 DEGRADED; canary: 1 not promotable -> blocked. degraded>0 -> error.
    expect(byKey('plugins')?.alert).toBe('error');
    expect(byKey('plugins')?.stats).toEqual([
      { labelKey: 'overview.plugins.active', value: 2, tone: 'ok' },
      { labelKey: 'overview.plugins.degraded', value: 1, tone: 'error' },
      { labelKey: 'overview.plugins.blocked', value: 1, tone: 'warn' },
    ]);

    // async: dead=2 -> error; enlace a la consola DLQ.
    expect(byKey('async')?.alert).toBe('error');
    expect(byKey('async')?.linkRoute).toEqual(['/executions/async-dlq']);
  });

  it('composite signals are hidden until their source is available', () => {
    // Sin summary ni pluginHealth aún → sin señales compuestas.
    expect(store.healthComposite()).toEqual([]);
  });

  it('aggregates all health signals into the banner summary', async () => {
    await store.load();

    // críticas: executions, files, plugins, async (4); atención: retries (1); estables: 0.
    expect(store.healthSummary()).toEqual({ critical: 4, warning: 1, stable: 0, worst: 'error' });
  });

  it('has no summary before loading', () => {
    expect(store.healthSummary()).toBeNull();
  });

  it('aggregates backend plugin diagnostics and canary metrics into plugin health', async () => {
    await store.load();

    expect(store.pluginHealth()).toEqual({ active: 2, degraded: 1, blocked: 1 });
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
