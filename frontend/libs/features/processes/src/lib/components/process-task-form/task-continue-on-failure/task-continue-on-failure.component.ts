import { Component, inject, input, output } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { I18nService } from '@integration-hub/core/services';

/**
 * Política de fallo de una tarea: `continueOnFailure`. Es una opción de ejecución <b>general</b> (no
 * async, no de source): si la tarea devuelve fallo, el proceso continúa (la tarea completa con
 * errores) en vez de abortar. La lee el motor síncrono
 * ({@code ProcessExecutionService}) y también el scatter async (fallos de slice).
 *
 * <p>Distinta del `fileErrorPolicy` de <b>source</b> (que decide por archivo al leer varios), y del
 * despacho async (que decide dónde corre la tarea). Presentacional: emite el cambio; el host lo
 * persiste en la config de la tarea.</p>
 */
@Component({
  selector: 'ih-task-continue-on-failure',
  standalone: true,
  imports: [MatSlideToggleModule],
  template: `
    <div class="continue-on-failure">
      <mat-slide-toggle
        [checked]="continueOnFailure()"
        [disabled]="readonly()"
        (change)="continueOnFailureChange.emit($event.checked)">
        {{ i18n.t('ui.continueOnFailure') }}
      </mat-slide-toggle>
      <p class="continue-on-failure__hint">{{ i18n.t('ui.continueOnFailureHint') }}</p>
    </div>
  `,
  styles: [
    `
      .continue-on-failure {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .continue-on-failure__hint {
        margin: 0;
        font-size: 0.85rem;
        opacity: 0.75;
      }
    `,
  ],
})
export class TaskContinueOnFailureComponent {
  readonly i18n = inject(I18nService);

  readonly continueOnFailure = input(false);
  readonly readonly = input(false);

  readonly continueOnFailureChange = output<boolean>();
}
