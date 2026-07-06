import { Component, computed, input } from '@angular/core';
import { AsyncHealth } from '../../models/overview-async-health.model';
import { OverviewHealthCardComponent, OverviewHealthStat } from '../overview-health-card/overview-health-card.component';

/**
 * Card de salud del backbone async (ADR-015): mapea {@link AsyncHealth} al card genérico. Filas muertas
 * elevan a error; scatters estancados, a advertencia. Render/estilo en el card compartido.
 */
@Component({
  selector: 'ih-overview-async-health-card',
  standalone: true,
  imports: [OverviewHealthCardComponent],
  template: `<ih-overview-health-card
    [titleKey]="'overview.async.title'"
    [alert]="alert()"
    [stats]="stats()"
    [linkRoute]="['/executions/async-dlq']"
    [linkLabelKey]="'overview.async.viewConsole'"
  />`,
})
export class OverviewAsyncHealthCardComponent {
  readonly health = input.required<AsyncHealth>();

  /** Filas muertas elevan a error; scatters estancados, a advertencia; limpio, sin alerta. */
  readonly alert = computed<'error' | 'warn' | null>(() => {
    const health = this.health();
    if (health.dead > 0) {
      return 'error';
    }
    return health.stalled > 0 ? 'warn' : null;
  });

  readonly stats = computed<OverviewHealthStat[]>(() => {
    const health = this.health();
    return [
      { labelKey: 'overview.async.dead', value: health.dead, tone: 'error' },
      { labelKey: 'overview.async.stalled', value: health.stalled, tone: 'warn' },
    ];
  });
}
