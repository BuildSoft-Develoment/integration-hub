import { Component, inject, input, output } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
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
  imports: [MatSlideToggleModule, MatTooltipModule],
  template: `
    <div class="continue-on-failure">
      <mat-slide-toggle
        [checked]="continueOnFailure()"
        [disabled]="readonly()"
        (change)="continueOnFailureChange.emit($event.checked)">
        {{ i18n.t('ui.continueOnFailure') }}
      </mat-slide-toggle>
      <span
        class="hint-info"
        [matTooltip]="i18n.t('ui.continueOnFailureHint')"
        matTooltipPosition="above"
        tabindex="0"
        role="img"
        [attr.aria-label]="i18n.t('ui.continueOnFailureHint')">i</span>
    </div>
  `,
  styles: [
    `
      .continue-on-failure {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      /* Marcador de info: la explicación completa va en el tooltip (no en un párrafo). */
      .hint-info {
        display: inline-grid;
        place-items: center;
        width: 1.05rem;
        height: 1.05rem;
        border-radius: 50%;
        border: 1px solid var(--ih-border);
        color: var(--ih-text-soft);
        font-size: 0.7rem;
        font-style: italic;
        font-weight: 700;
        line-height: 1;
        cursor: help;
        user-select: none;
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
