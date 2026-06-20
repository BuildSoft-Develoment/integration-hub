import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { I18nService } from '@integration-hub/core/services';
import { IconComponent } from '@integration-hub/shared/ui';
import { OverviewAlertLevel } from '../../models/overview.models';

@Component({
  selector: 'ih-overview-metric-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, IconComponent],
  templateUrl: './overview-metric-card.component.html',
  styleUrl: './overview-metric-card.component.css',
})
export class OverviewMetricCardComponent {
  readonly i18n = inject(I18nService);

  readonly titleKey = input.required<string>();
  readonly value = input.required<number>();
  readonly detail = input<number | null>(null);
  readonly alertLevel = input<OverviewAlertLevel | null>(null);
  readonly actionLink = input<string[] | null>(null);
  readonly actionLabelKey = input<string | null>(null);
}
