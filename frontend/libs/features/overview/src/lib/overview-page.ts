import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { OverviewMetricCardComponent } from './components/overview-metric-card/overview-metric-card.component';
import { OverviewTableCardComponent } from './components/overview-table-card/overview-table-card.component';
import { OverviewStore } from './overview.store';

@Component({
  selector: 'ih-overview-page',
  standalone: true,
  providers: [OverviewStore],
  imports: [CommonModule, OverviewMetricCardComponent, OverviewTableCardComponent],
  templateUrl: './overview-page.html',
  styleUrl: './overview-page.css',
})
export class OverviewPageComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly store = inject(OverviewStore);

  readonly recentExecutions = computed(() =>
    (this.store.summary()?.recentExecutions ?? []).map((item) => ({
      primary: item.processName,
      secondary: `#${item.id}`,
      status: item.status,
      timestamp: item.startedAt,
    }))
  );

  readonly failedHighlights = computed(() =>
    (this.store.summary()?.failedExecutionHighlights ?? []).map((item) => ({
      primary: item.processName,
      secondary: `#${item.id}`,
      status: item.status,
      timestamp: item.finishedAt,
    }))
  );

  readonly recentAudit = computed(() =>
    (this.store.summary()?.recentAuditEvents ?? []).map((item) => ({
      primary: item.eventType,
      secondary: item.message || `#${item.id}`,
      status: item.status,
      timestamp: item.createdAt,
    }))
  );

  ngOnInit(): void {
    void this.store.load();
  }
}
