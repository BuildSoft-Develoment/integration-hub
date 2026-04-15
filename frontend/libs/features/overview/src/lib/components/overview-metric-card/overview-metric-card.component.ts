import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';

@Component({
  selector: 'ih-overview-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="metric-card">
      <p class="metric-label">{{ i18n.t(titleKey()) }}</p>
      <strong class="metric-value">{{ value() }}</strong>
      @if (detail() !== null) {
        <p class="metric-detail ih-muted">{{ i18n.t('overview.metric.activeDetail', { count: detail()! }) }}</p>
      }
    </article>
  `,
  styles: [`
    .metric-card { display:grid; gap:0.35rem; padding:1rem; border:1px solid var(--ih-border); border-radius:18px; background:color-mix(in srgb, var(--ih-surface-alt) 94%, transparent); min-width:0; }
    .metric-label { margin:0; color:var(--ih-text-soft); font-size:0.75rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; }
    .metric-value { font-size:2rem; font-weight:800; letter-spacing:-0.05em; }
    .metric-detail { margin:0; font-size:0.88rem; }
  `],
})
export class OverviewMetricCardComponent {
  readonly i18n = inject(I18nService);

  readonly titleKey = input.required<string>();
  readonly value = input.required<number>();
  readonly detail = input<number | null>(null);
}
