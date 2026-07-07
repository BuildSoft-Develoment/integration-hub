import { Component, computed, input } from '@angular/core';
import { PluginHealth } from '../../models/overview-plugin-health.model';
import { OverviewHealthCardComponent, OverviewHealthStat } from '../overview-health-card/overview-health-card.component';

/**
 * Card de salud de plugins: mapea {@link PluginHealth} al card genérico ({@link OverviewHealthCardComponent}).
 * Sólo conoce su dominio (qué es alerta, qué stats); el render/estilo vive en el card compartido.
 */
@Component({
  selector: 'ih-overview-plugin-health-card',
  standalone: true,
  imports: [OverviewHealthCardComponent],
  template: `<ih-overview-health-card
    [titleKey]="'overview.plugins.title'"
    [alert]="alert()"
    [stats]="stats()"
    [linkRoute]="['/plugins']"
    [linkLabelKey]="'overview.action.viewPlugins'"
  />`,
})
export class OverviewPluginHealthCardComponent {
  readonly health = input.required<PluginHealth>();

  /** Any degraded or blocked plugin raises the card's alert level. */
  readonly alert = computed<'error' | 'warn' | null>(() => {
    const health = this.health();
    if (health.degraded > 0) {
      return 'error';
    }
    return health.blocked > 0 ? 'warn' : null;
  });

  readonly stats = computed<OverviewHealthStat[]>(() => {
    const health = this.health();
    return [
      { labelKey: 'overview.plugins.active', value: health.active, tone: 'ok' },
      { labelKey: 'overview.plugins.degraded', value: health.degraded, tone: 'error' },
      { labelKey: 'overview.plugins.blocked', value: health.blocked, tone: 'warn' },
    ];
  });
}
