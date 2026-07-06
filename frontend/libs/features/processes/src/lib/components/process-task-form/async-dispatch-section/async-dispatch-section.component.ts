import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { I18nService } from '@integration-hub/core/services';
import { AsyncOffloadSupport, AsyncState } from '../../../api/messaging-transports.service';

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

      @if (toggleShown()) {
        <mat-slide-toggle
          [checked]="async()"
          [disabled]="toggleDisabled()"
          (change)="asyncChange.emit($event.checked)">
          {{ i18n.t('ui.asyncDispatch') }}
        </mat-slide-toggle>
      }

      @if (!available()) {
        <p class="async-dispatch__hint async-dispatch__hint--unavailable">{{ unavailableReason() }}</p>
      }

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

        @if (asyncWarningKey(); as key) {
          <p class="async-dispatch__warning">{{ i18n.t(key) }}</p>
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
      .async-dispatch__hint--unavailable {
        opacity: 0.9;
        font-style: italic;
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
  /**
   * Estado compuesto del despacho async en el entorno (backend #4): `READY` operativo end-to-end; `DISABLED` apagado
   * (correrá síncrono); `DEGRADED` habilitado pero no operativo (relay/consumer/broker no listos → quedaría encolado
   * sin procesarse). Solo alimenta el aviso (advisory); no gatea el toggle. Default `READY` (permisivo).
   */
  readonly asyncState = input<AsyncState>('READY');
  /**
   * Capacidad de offload async del tipo de tarea (del catálogo backend, ADR-015). Gatea el toggle:
   * `UNSUPPORTED` no lo ofrece; `SLICE_ONLY` solo en modos distribuidos (batch/per-record). Default
   * `SUPPORTED` (permisivo) para no gatear cuando el host no provee la capacidad.
   */
  readonly offloadSupport = input<AsyncOffloadSupport>('SUPPORTED');

  readonly asyncChange = output<boolean>();
  readonly transportChange = output<string>();

  /** batch/per-record + async ⇒ reparto distribuido (scatter); once + async ⇒ offload de una unidad. */
  readonly distributed = computed(
    () => this.async() && (this.executionMode() === 'batch' || this.executionMode() === 'per-record')
  );

  /** Si el modo actual reparte records en slices (donde REST_CALL/SLICE_ONLY sí es offloadable). */
  private readonly scatterMode = computed(
    () => this.executionMode() === 'batch' || this.executionMode() === 'per-record'
  );

  /** Si el tipo (en el modo actual) admite async, según su capacidad declarada. */
  readonly available = computed(() => {
    switch (this.offloadSupport()) {
      case 'SUPPORTED':
        return true;
      case 'SLICE_ONLY':
        return this.scatterMode();
      default:
        return false;
    }
  });

  /** Motivo por el que async no está disponible (para el hint). */
  readonly unavailableReason = computed(() => {
    if (this.available()) {
      return '';
    }
    return this.offloadSupport() === 'SLICE_ONLY'
      ? this.i18n.t('ui.asyncScatterOnly')
      : this.i18n.t('ui.asyncNotSupported');
  });

  /** El toggle se muestra si async es admisible, o si ya está activo (para poder desactivarlo). */
  readonly toggleShown = computed(() => this.available() || this.async());

  /** Deshabilitado en readonly, o cuando no es admisible y no está ya activo (no se puede activar). */
  readonly toggleDisabled = computed(() => this.readonly() || (!this.available() && !this.async()));

  readonly modeHint = computed(() => {
    if (!this.async()) {
      return this.i18n.t('ui.asyncModeSync');
    }
    return this.distributed() ? this.i18n.t('ui.asyncModeScatter') : this.i18n.t('ui.asyncModeOffload');
  });

  /**
   * Clave i18n del aviso según el estado del entorno (o `null` si READY → sin aviso). SRP: la sección mapea
   * estado→mensaje; OCP: un estado futuro es otra rama. Distingue "apagado" de "habilitado-pero-roto" (DEGRADED),
   * haciendo visible el estado compuesto de #4.
   */
  readonly asyncWarningKey = computed<string | null>(() => {
    switch (this.asyncState()) {
      case 'DISABLED':
        return 'ui.asyncFeatureDisabled';
      case 'DEGRADED':
        return 'ui.asyncFeatureDegraded';
      default:
        return null;
    }
  });
}
