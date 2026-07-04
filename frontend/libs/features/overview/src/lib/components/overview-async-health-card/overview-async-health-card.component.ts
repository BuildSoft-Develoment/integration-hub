import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { I18nService } from '@integration-hub/core/services';
import { IconComponent } from '@integration-hub/shared/ui';
import { AsyncHealth } from '../../models/overview-async-health.model';

@Component({
  selector: 'ih-overview-async-health-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, IconComponent],
  templateUrl: './overview-async-health-card.component.html',
  styleUrl: './overview-async-health-card.component.css',
})
export class OverviewAsyncHealthCardComponent {
  readonly i18n = inject(I18nService);

  readonly health = input.required<AsyncHealth>();

  /** Filas muertas elevan a error; scatters estancados, a advertencia; limpio, sin alerta. */
  readonly alert = computed<'error' | 'warn' | null>(() => {
    const health = this.health();
    if (health.dead > 0) {
      return 'error';
    }
    return health.stalled > 0 ? 'warn' : null;
  });
}
