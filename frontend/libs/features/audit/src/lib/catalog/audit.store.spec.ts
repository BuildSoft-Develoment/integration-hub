import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuditApiService } from '../api/audit-api.service';
import { AuditStore, EXPORT_MAX_ROWS } from './audit.store';

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

describe('AuditStore · exportacion', () => {
  let store: AuditStore;
  let list: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    list = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuditStore, { provide: AuditApiService, useValue: { list } }],
    });
    store = TestBed.inject(AuditStore);
  });

  it('exporta la CONSULTA COMPLETA, no la pagina que se esta viendo', async () => {
    // La pantalla muestra 8 por pagina. Antes se exportaban esos 8 y el fichero se archivaba como
    // si fuera la consulta entera.
    list.mockReturnValue(
      of({ items: [createAuditEvent(1)], total: 1, eventTypeOptions: [] })
    );
    store.updatePagination(3, 8); // el usuario esta en la cuarta pagina

    await store.fetchForExport();

    const peticion = list.mock.calls.at(-1)![0];
    expect(peticion.page, 'la exportacion no puede arrancar en la pagina que se ve').toBe(0);
    expect(peticion.size, 'debe pedir el lote de exportacion, no el tamano de pagina')
      .toBe(EXPORT_MAX_ROWS);
  });

  it('exporta con los MISMOS filtros que la pantalla', async () => {
    // Un export que ignore el filtro seria peor que el defecto original: entregaria de mas.
    list.mockReturnValue(of({ items: [], total: 0, eventTypeOptions: [] }));
    store.updateEventTypeFilter('TASK_FAILED');
    store.updateStatusFilter('FAILED');
    await flushAsync();

    await store.fetchForExport();

    const peticion = list.mock.calls.at(-1)![0];
    expect(peticion.eventType).toBe('TASK_FAILED');
    expect(peticion.status).toBe('FAILED');
  });

  it('avisa de que quedaron filas fuera cuando la consulta supera el tope', async () => {
    // Callarlo es lo grave: quien exporta cree que se lo llevo todo.
    list.mockReturnValue(
      of({ items: [createAuditEvent(1), createAuditEvent(2)], total: 48213, eventTypeOptions: [] })
    );

    const resultado = await store.fetchForExport();

    expect(resultado.truncado).toBe(true);
    expect(resultado.total, 'el total sirve para decir cuantas faltan').toBe(48213);
    expect(resultado.events).toHaveLength(2);
  });

  it('no marca como truncado lo que cabe entero', async () => {
    list.mockReturnValue(
      of({ items: [createAuditEvent(1), createAuditEvent(2)], total: 2, eventTypeOptions: [] })
    );

    expect((await store.fetchForExport()).truncado).toBe(false);
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
