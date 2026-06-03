// @trace RF-003 (observabilidad: navegar a ejecuciones relacionadas (hijas/reproceso))
import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import { ExecutionNavigationEntry, ProcessExecutionRecord } from '../../models/execution.models';
import { formatExecutionDate, formatTriggerSourceLabel } from '../../details/execution-detail.utils';

@Component({
  selector: 'ih-execution-lineage',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  styles: [`
    .lineage-shell { display:grid; gap:1rem; padding-top:0.25rem; }
    .lineage-breadcrumb { display:flex; flex-wrap:wrap; gap:0.35rem; align-items:center; color:var(--ih-text-soft); }
    .lineage-breadcrumb__link { border:0; background:none; padding:0; color:var(--ih-accent-strong); cursor:pointer; font:inherit; }
    .lineage-breadcrumb__sep { color:var(--ih-text-soft); }
    .lineage-breadcrumb__current { color:var(--ih-text); font-weight:600; }
    .lineage-actions { display:flex; flex-wrap:wrap; gap:0.6rem; }
    .lineage-card { display:grid; gap:0.8rem; padding:0.95rem; border:1px solid var(--ih-border); border-radius:18px; background:color-mix(in srgb, var(--ih-surface-alt) 90%, transparent); }
    .lineage-card__header h4 { margin:0.28rem 0 0; font-size:1rem; }
    .section-eyebrow { margin:0; font-size:0.74rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--ih-text-soft); }
    .lineage-record { display:grid; gap:0.35rem; }
    .lineage-list { display:grid; gap:0.6rem; }
    .lineage-list__item { display:grid; grid-template-columns:minmax(0, 1fr) auto; gap:0.75rem; align-items:center; width:100%; border:1px solid var(--ih-border); border-radius:16px; background:var(--ih-surface); padding:0.85rem; text-align:left; cursor:pointer; }
    .lineage-list__copy, .lineage-list__meta { display:grid; gap:0.18rem; }
    .lineage-list__copy small, .lineage-list__meta small { color:var(--ih-text-soft); }
    .lineage-list__meta { justify-items:end; text-align:right; }
    .empty-inline { padding:0.35rem 0; }
    @media (max-width: 900px) { .lineage-list__item { grid-template-columns:1fr; } .lineage-list__meta { justify-items:start; text-align:left; } }
  `],
    templateUrl: './execution-lineage.component.html'
})
export class ExecutionLineageComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly execution = input<ProcessExecutionRecord | null>(null);
  readonly children = input<readonly ProcessExecutionRecord[]>([]);
  readonly navigationStack = input<readonly ExecutionNavigationEntry[]>([]);
  readonly openExecution = output<number>();
  readonly goBack = output<void>();

  statusLabel(status: string): string {
    return this.i18n.t(`executionStatus.${status}`);
  }

  formatDate(value: string | null): string {
    return formatExecutionDate(this.dateTime, value);
  }

  triggerLabel(value: string | null): string {
    return formatTriggerSourceLabel(value);
  }
}
