import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';

/** KPI de inventario del overview: número grande + total activo. Presentacional, sin alertas. */
@Component({
  selector: 'ih-overview-metric-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview-metric-card.component.html',
  styleUrl: './overview-metric-card.component.css',
})
export class OverviewMetricCardComponent {
  readonly i18n = inject(I18nService);

  readonly titleKey = input.required<string>();
  readonly value = input.required<number>();
  readonly activeCount = input<number | null>(null);
}
