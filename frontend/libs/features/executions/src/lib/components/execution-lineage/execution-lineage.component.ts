import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import { ExecutionNavigationEntry, ProcessExecutionRecord } from '../../execution.models';
import { formatTriggerSourceLabel } from '../../execution-detail.utils';

@Component({
  selector: 'ih-execution-lineage',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <section class="lineage-shell">
      <div class="lineage-breadcrumb">
        @for (entry of navigationStack(); track entry.executionId; let index = $index) {
          <button type="button" class="lineage-breadcrumb__link" (click)="openExecution.emit(entry.executionId)">
            {{ entry.label }}
          </button>
          <span class="lineage-breadcrumb__sep">/</span>
        }
        <span class="lineage-breadcrumb__current">
          {{ execution() ? 'Ejecucion ' + execution()!.id : i18n.t('executions.currentExecution') }}
        </span>
      </div>

      <div class="lineage-actions">
        @if (execution()?.sourceExecutionId) {
          <button mat-stroked-button type="button" (click)="openExecution.emit(execution()!.sourceExecutionId!)">
            {{ i18n.t('executions.openSourceExecution') }}
          </button>
        }
        @if (navigationStack().length) {
          <button mat-button type="button" (click)="goBack.emit()">
            {{ i18n.t('executions.backToPreviousExecution') }}
          </button>
        }
      </div>

      <section class="lineage-card">
        <div class="lineage-card__header">
          <p class="section-eyebrow">{{ i18n.t('executions.detail') }}</p>
          <h4>{{ execution() ? 'Ejecucion actual' : i18n.t('executions.noLineage') }}</h4>
        </div>

        @if (execution()) {
          <div class="lineage-record">
            <strong>#{{ execution()!.id }} · {{ execution()!.processName }}</strong>
            <span>{{ i18n.t('common.status') }}: {{ statusLabel(execution()!.status) }}</span>
            <span>{{ i18n.t('executions.triggerSource') }}: {{ triggerLabel(execution()!.triggerSource) }}</span>
            <span>{{ i18n.t('executions.startedAt') }}: {{ formatDate(execution()!.startedAt) }}</span>
          </div>
        }
      </section>

      <section class="lineage-card">
        <div class="lineage-card__header">
          <p class="section-eyebrow">{{ i18n.t('executions.childExecutions') }}</p>
          <h4>{{ i18n.t('executions.childExecutions') }} ({{ children().length }})</h4>
        </div>

        <div class="lineage-list">
          @for (child of children(); track child.id) {
            <button type="button" class="lineage-list__item" (click)="openExecution.emit(child.id)">
              <div class="lineage-list__copy">
                <strong>#{{ child.id }} · {{ child.processName }}</strong>
                <small>{{ i18n.t('executions.triggerSource') }}: {{ triggerLabel(child.triggerSource) }}</small>
              </div>
              <div class="lineage-list__meta">
                <span>{{ statusLabel(child.status) }}</span>
                <small>{{ formatDate(child.startedAt) }}</small>
              </div>
            </button>
          } @empty {
            <div class="empty-inline ih-muted">{{ i18n.t('executions.noChildExecutions') }}</div>
          }
        </div>
      </section>
    </section>
  `,
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
    return value ? this.dateTime.formatIso(value) : '-';
  }

  triggerLabel(value: string | null): string {
    return formatTriggerSourceLabel(value);
  }
}
