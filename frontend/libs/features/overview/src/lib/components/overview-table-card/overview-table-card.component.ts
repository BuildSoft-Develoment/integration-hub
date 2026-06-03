// @trace RF-004 (observabilidad: resumen operativo agregado / overview-summary)
import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { DateTimeService, I18nService } from '@integration-hub/core/services';

interface TableRow {
  primary: string;
  secondary?: string | null;
  status?: string | null;
  timestamp?: string | null;
}

@Component({
  selector: 'ih-overview-table-card',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .table-card { display:grid; grid-template-rows:auto minmax(0,1fr); border:1px solid var(--ih-border); border-radius:20px; background:color-mix(in srgb, var(--ih-surface-alt) 96%, transparent); min-height:100%; }
    .table-card__header { padding:1rem 1rem 0.8rem; border-bottom:1px solid var(--ih-border); }
    .table-card__header h3 { margin:0; font-size:1rem; letter-spacing:-0.03em; }
    .table-card__body { display:grid; align-content:start; }
    .table-card__row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:0.75rem; align-items:center; padding:0.9rem 1rem; border-bottom:1px solid color-mix(in srgb, var(--ih-border) 78%, transparent); }
    .table-card__row:last-child { border-bottom:0; }
    .table-card__copy { display:grid; gap:0.18rem; min-width:0; }
    .table-card__copy strong, .table-card__copy small { overflow-wrap:anywhere; }
    .table-card__copy small { color:var(--ih-text-soft); }
    .table-card__meta { display:grid; justify-items:end; gap:0.2rem; text-align:right; }
    .table-card__badge { display:inline-flex; padding:0.22rem 0.55rem; border-radius:999px; background:color-mix(in srgb, var(--ih-accent) 10%, transparent); color:var(--ih-accent-strong); font-size:0.78rem; font-weight:700; }
    .empty-state { min-height:12rem; display:grid; place-items:center; padding:1rem; text-align:center; }
    @media (max-width: 760px) { .table-card__row { grid-template-columns:1fr; } .table-card__meta { justify-items:start; text-align:left; } }
  `],
    templateUrl: './overview-table-card.component.html'
})
export class OverviewTableCardComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly titleKey = input.required<string>();
  readonly emptyKey = input.required<string>();
  readonly rows = input.required<readonly TableRow[]>();

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value) : '-';
  }
}
