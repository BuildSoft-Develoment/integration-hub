import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@integration-hub/core/services';
import { IconComponent, LoadingComponent, SlotOutletComponent } from '@integration-hub/shared/ui';
import { OverviewMetricCardComponent } from '../components/overview-metric-card/overview-metric-card.component';
import { OverviewHealthCardComponent } from '../components/overview-health-card/overview-health-card.component';
import { OverviewTableCardComponent } from '../components/overview-table-card/overview-table-card.component';
import { OverviewStore } from './overview.store';

@Component({
  selector: 'ih-overview-page',
  standalone: true,
  providers: [OverviewStore],
  imports: [CommonModule, MatButtonModule, IconComponent, LoadingComponent, SlotOutletComponent, OverviewMetricCardComponent, OverviewHealthCardComponent, OverviewTableCardComponent],
  templateUrl: './overview-page.html',
  styleUrl: './overview-page.css',
})
export class OverviewPageComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly store = inject(OverviewStore);

  ngOnInit(): void {
    void this.store.load();
  }
}
