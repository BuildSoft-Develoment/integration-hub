import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { I18nService } from '@integration-hub/core/services';
import { IconComponent } from '@integration-hub/shared/ui';
import { PluginHealth } from '../../models/overview-plugin-health.model';

@Component({
  selector: 'ih-overview-plugin-health-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, IconComponent],
  templateUrl: './overview-plugin-health-card.component.html',
  styleUrl: './overview-plugin-health-card.component.css',
})
export class OverviewPluginHealthCardComponent {
  readonly i18n = inject(I18nService);

  readonly health = input.required<PluginHealth>();

  /** Any degraded or blocked plugin raises the card's alert level. */
  readonly alert = computed<'error' | 'warn' | null>(() => {
    const health = this.health();
    if (health.degraded > 0) {
      return 'error';
    }
    return health.blocked > 0 ? 'warn' : null;
  });
}
