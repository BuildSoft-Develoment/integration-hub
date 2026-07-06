import { effect, inject, Injectable } from '@angular/core';

import { ExecutionDetailStore } from './execution-detail.store';

/** Cadencia del poll de progreso (ms). Bajo umbral: refresca sin martillar a escala de 1M. */
const PROGRESS_POLL_MS = 4000;

/**
 * Scheduler del progreso en vivo (SRP): decide <b>cuándo</b> refrescar. Reactivo a la ejecución
 * seleccionada + el drawer abierto ({@link ExecutionDetailStore}); re-apunta solo al navegar entre
 * ejecuciones y para al cerrar el drawer o al alcanzar estado terminal. La carga de datos vive en el
 * store; aquí solo está el temporizador. Se instancia a nivel de página (ver providers).
 */
@Injectable()
export class ExecutionProgressPoller {
  private readonly store = inject(ExecutionDetailStore);
  private handle: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect((onCleanup) => {
      const executionId = this.store.selectedExecutionId();
      const open = this.store.drawerOpen();
      this.stop();
      if (executionId == null || !open) {
        return;
      }
      this.handle = setInterval(() => void this.tick(executionId), PROGRESS_POLL_MS);
      onCleanup(() => this.stop());
    });
  }

  private async tick(executionId: number): Promise<void> {
    const result = await this.store.refreshLiveSnapshot(executionId);
    if (result != null && !result.active) {
      this.stop(); // terminal: ya se tomó la última foto.
    }
  }

  private stop(): void {
    if (this.handle != null) {
      clearInterval(this.handle);
      this.handle = null;
    }
  }
}
