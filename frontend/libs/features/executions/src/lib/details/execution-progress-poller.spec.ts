import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ExecutionDetailStore } from './execution-detail.store';
import { ExecutionProgressPoller } from './execution-progress-poller';

// Proyecto zoneless (vitest): se usan los fake timers de vitest + TestBed.tick() para flushear el effect.
describe('ExecutionProgressPoller', () => {
  let selectedExecutionId: WritableSignal<number | null>;
  let drawerOpen: WritableSignal<boolean>;
  let refreshLiveSnapshot: ReturnType<typeof vi.fn>;

  function setup(): void {
    selectedExecutionId = signal<number | null>(null);
    drawerOpen = signal(false);
    refreshLiveSnapshot = vi.fn().mockResolvedValue({ active: true });
    TestBed.configureTestingModule({
      providers: [
        ExecutionProgressPoller,
        {
          provide: ExecutionDetailStore,
          useValue: { selectedExecutionId, drawerOpen, refreshLiveSnapshot },
        },
      ],
    });
    TestBed.inject(ExecutionProgressPoller); // instancia → registra el effect
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('pollea mientras hay ejecución seleccionada y el drawer abierto', async () => {
    setup();
    selectedExecutionId.set(5);
    drawerOpen.set(true);
    TestBed.tick(); // flush del effect → arranca el intervalo
    await vi.advanceTimersByTimeAsync(4000); // primer tick del poll (+ flush async)
    expect(refreshLiveSnapshot).toHaveBeenCalledWith(5);
  });

  it('no pollea con el drawer cerrado', async () => {
    setup();
    selectedExecutionId.set(5);
    drawerOpen.set(false);
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(8000);
    expect(refreshLiveSnapshot).not.toHaveBeenCalled();
  });

  it('se auto-detiene al alcanzar estado terminal', async () => {
    setup();
    refreshLiveSnapshot.mockResolvedValue({ active: false }); // terminal
    selectedExecutionId.set(5);
    drawerOpen.set(true);
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(4000); // 1er tick → terminal → stop()
    expect(refreshLiveSnapshot).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(20000); // no más ticks tras el terminal
    expect(refreshLiveSnapshot).toHaveBeenCalledTimes(1);
  });
});
