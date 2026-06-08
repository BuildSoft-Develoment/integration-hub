// @trace spec 003-diseno-y-ejecucion-procesos T-016 (M-1b: bridge para outputs de componentes dinamicos)
// @trace ADR-009
import { Injectable, signal } from '@angular/core';
import { ProcessTaskFormModel } from './process-task.models';

/**
 * Bridge para que formularios renderizados dinamicamente (via
 * {@code ngComponentOutlet}) emitan parches al modelo de tarea.
 *
 * <p>Angular {@code ngComponentOutlet} expone {@code inputs} pero no {@code outputs}
 * directamente. En vez de cablear {@code ViewChild + ComponentRef.instance}, el host
 * provee este servicio en su nivel de injector y los formularios verticales lo
 * inyectan para llamar {@link emit}.</p>
 *
 * <p>Solo formularios <b>nuevos</b> usan este puente. Los 7 formularios legacy del
 * host siguen con {@code (patchTask)="patchTask.emit($event)"} hasta su migracion.</p>
 *
 * <p>Implementacion via {@code signal}: el host suscribe efectos al valor del signal
 * para propagar el patch hacia su propio {@code output()}.</p>
 */
@Injectable()
export class ProcessTaskFormBridgeService {
  /**
   * Ultimo patch emitido. Usar effect/computed en el host para reaccionar. El valor
   * incluye un id de evento autoincremental para distinguir emisiones consecutivas
   * con el mismo payload.
   */
  readonly lastPatch = signal<{ readonly id: number; readonly patch: Partial<ProcessTaskFormModel> } | null>(null);

  private sequence = 0;

  /** Llamado por el formulario vertical cada vez que el draft cambia. */
  emit(patch: Partial<ProcessTaskFormModel>): void {
    this.sequence += 1;
    this.lastPatch.set({ id: this.sequence, patch });
  }
}
