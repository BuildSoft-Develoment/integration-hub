import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { I18nService } from '@integration-hub/core/services';

/**
 * Sección de configuración del <b>despacho async</b> de una tarea (ADR-015). Presentacional: recibe
 * los valores actuales y emite cambios; el form host los persiste en la config de la tarea
 * (`async`, `asyncTransport`).
 *
 * <p>El significado del flag depende del `executionMode`:</p>
 * <ul>
 *   <li><b>once</b> + async → offload de la tarea como una unidad (per-task).</li>
 *   <li><b>batch/per-record</b> + async → reparto en slices, procesado <b>distribuido</b> entre
 *       workers (scatter-gather, Opción B).</li>
 * </ul>
 *
 * <p><b>Nota</b>: {@code continueOnFailure} NO vive aquí — es una política de ejecución de tarea
 * general (aplica también a batch síncrono), expuesta por {@code TaskContinueOnFailureComponent}.</p>
 */
@Component({
  selector: 'ih-async-dispatch-section',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, MatSlideToggleModule],
  template: `
    <div class="async-dispatch">
      <div class="task-section-header">{{ i18n.t('ui.asyncDispatchOptions') }}</div>

      <mat-slide-toggle
        [checked]="async()"
        [disabled]="readonly()"
        (change)="asyncChange.emit($event.checked)">
        {{ i18n.t('ui.asyncDispatch') }}
      </mat-slide-toggle>

      @if (async()) {
        <mat-form-field appearance="outline">
          <mat-label>{{ i18n.t('ui.asyncTransport') }}</mat-label>
          <mat-select
            [value]="transport()"
            [disabled]="readonly()"
            (selectionChange)="transportChange.emit($event.value)">
            @for (option of transports(); track option) {
              <mat-option [value]="option">{{ option }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <p class="async-dispatch__hint" [class.async-dispatch__hint--distributed]="distributed()">
          {{ modeHint() }}
        </p>

        @if (!featureEnabled()) {
          <p class="async-dispatch__warning">{{ i18n.t('ui.asyncFeatureDisabled') }}</p>
        }
      }
    </div>
  `,
  styles: [
    `
      .async-dispatch {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .async-dispatch__hint {
        margin: 0;
        font-size: 0.85rem;
        opacity: 0.75;
      }
      .async-dispatch__hint--distributed {
        font-weight: 600;
        opacity: 0.9;
      }
      .async-dispatch__warning {
        margin: 0;
        font-size: 0.85rem;
        color: var(--ih-warning, #b45309);
      }
    `,
  ],
})
export class AsyncDispatchSectionComponent {
  readonly i18n = inject(I18nService);

  readonly async = input(false);
  readonly transport = input('KAFKA');
  readonly executionMode = input('once');
  readonly transports = input<readonly string[]>(['KAFKA']);
  readonly readonly = input(false);
  /** Si el feature de despacho async está activo en el entorno; si no, se avisa que correrá síncrono. */
  readonly featureEnabled = input(true);

  readonly asyncChange = output<boolean>();
  readonly transportChange = output<string>();

  /** batch/per-record + async ⇒ reparto distribuido (scatter); once + async ⇒ offload de una unidad. */
  readonly distributed = computed(
    () => this.async() && (this.executionMode() === 'batch' || this.executionMode() === 'per-record')
  );

  readonly modeHint = computed(() => {
    if (!this.async()) {
      return this.i18n.t('ui.asyncModeSync');
    }
    return this.distributed() ? this.i18n.t('ui.asyncModeScatter') : this.i18n.t('ui.asyncModeOffload');
  });
}
