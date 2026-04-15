import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import { ScheduleRecord } from '../../schedules.models';

@Component({
  selector: 'ih-schedules-editor',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <section class="panel-card ih-drawer-editor">
      <div class="panel-body ih-drawer-editor__body">
        <div class="panel-topbar">
          <button mat-stroked-button type="button" (click)="close.emit()">
            {{ i18n.t('common.close') }}
          </button>
        </div>

        @if (schedule()) {
          <div class="profile-stack">
            <div class="profile-header">
              <div class="profile-avatar">{{ modeLabel().slice(0, 1).toUpperCase() }}</div>
              <div class="profile-copy">
                <h3 class="profile-name">{{ i18n.t('schedules.detail') }}</h3>
                <p class="profile-subtitle">{{ modeLabel() }}</p>
              </div>
            </div>
          </div>

          <section class="form-section">
            <div class="section-header">
              <p class="section-eyebrow">{{ i18n.t('ui.overview') }}</p>
              <h4>{{ i18n.t('schedules.detail') }}</h4>
            </div>

            <div class="detail-grid">
              <div><strong>{{ i18n.t('common.status') }}</strong>: {{ schedule()!.active ? i18n.t('status.active') : i18n.t('status.inactive') }}</div>
              <div><strong>{{ i18n.t('processes.mode') }}</strong>: {{ schedule()!.scheduled ? i18n.t('status.scheduled') : i18n.t('status.manual') }}</div>
              <div><strong>{{ i18n.t('schedules.frequency') }}</strong>: {{ schedule()!.scheduleEvery || '-' }}</div>
              <div><strong>{{ i18n.t('schedules.nextRun') }}</strong>: {{ formatDate(schedule()!.nextRunAt) }}</div>
              <div><strong>{{ i18n.t('schedules.lastRun') }}</strong>: {{ formatDate(schedule()!.lastRunAt) }}</div>
            </div>

            @if (schedule()!.description) {
              <div class="detail-block">
                <strong>{{ i18n.t('processes.description') }}</strong>
                <p>{{ schedule()!.description }}</p>
              </div>
            }
          </section>

          @if (canOperate()) {
            <section class="actions-row">
              <button mat-flat-button type="button" [disabled]="executing()" (click)="run.emit()">
                {{ executing() ? i18n.t('processes.running') : i18n.t('processes.run') }}
              </button>
            </section>
          }
        } @else {
          <div class="empty-state ih-muted">{{ i18n.t('schedules.emptySelection') }}</div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        min-width: 0;
      }
      .panel-card {
        min-height: 100%;
        height: 100%;
        width: 100%;
        min-width: 0;
      }
      .panel-body {
        min-height: 100%;
        display: grid;
        align-content: start;
        padding: 1rem;
        overflow: auto;
        width: 100%;
        min-width: 0;
      }
      .panel-topbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 0.65rem;
      }
      .profile-stack {
        display: grid;
        gap: 0.8rem;
        margin-bottom: 1rem;
      }
      .profile-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 0;
      }
      .profile-avatar {
        display: grid;
        place-items: center;
        width: 4rem;
        height: 4rem;
        border-radius: 22px;
        background: color-mix(in srgb, var(--ih-accent) 14%, transparent);
        color: var(--ih-accent-strong);
        font-size: 1.2rem;
        font-weight: 800;
      }
      .profile-copy {
        display: grid;
        gap: 0.28rem;
        min-width: 0;
      }
      .section-eyebrow {
        margin: 0;
        font-size: 0.74rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--ih-text-soft);
      }
      .profile-name {
        margin: 0;
        font-size: 1.45rem;
        font-weight: 700;
        letter-spacing: -0.03em;
        overflow-wrap: anywhere;
      }
      .profile-subtitle {
        margin: 0;
        color: var(--ih-text-soft);
        overflow-wrap: anywhere;
      }
      .detail-grid strong {
        font-weight: 700;
      }
      .form-section {
        display: grid;
        gap: 0.9rem;
        padding: 0.95rem;
        border: 1px solid var(--ih-border);
        border-radius: 18px;
        background: color-mix(in srgb, var(--ih-surface-alt) 93%, transparent);
        min-width: 0;
        margin-bottom: 0.9rem;
      }
      .section-header h4 {
        margin: 0.28rem 0 0;
        font-size: 1rem;
        overflow-wrap: anywhere;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.7rem;
      }
      .detail-block {
        display: grid;
        gap: 0.4rem;
      }
      .detail-block p {
        margin: 0;
        line-height: 1.5;
      }
      .actions-row {
        display: flex;
        justify-content: flex-start;
        flex-wrap: wrap;
      }
      .actions-row button {
        min-height: 2.55rem;
        padding-inline: 1rem;
        border-radius: 12px;
      }
      .empty-state {
        min-height: 20rem;
        display: grid;
        place-items: center;
        text-align: center;
      }
      @media (max-width: 900px) {
        .detail-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 760px) {
        .panel-body {
          padding: 0.8rem;
        }
        .profile-stack {
          margin-bottom: 0.75rem;
        }
        .profile-avatar {
          width: 3rem;
          height: 3rem;
          border-radius: 16px;
          font-size: 0.95rem;
        }
        .profile-name {
          font-size: 1.1rem;
        }
        .form-section {
          gap: 0.7rem;
          padding: 0.8rem;
          border-radius: 16px;
          margin-bottom: 0.75rem;
        }
        .actions-row button {
          width: auto;
          min-height: 2.35rem;
          padding-inline: 0.85rem;
        }
      }
      @media (max-height: 700px) and (min-width: 761px) {
        .panel-body {
          padding: 0.85rem;
        }
        .panel-topbar {
          margin-bottom: 0.45rem;
        }
        .profile-stack {
          gap: 0.55rem;
          margin-bottom: 0.75rem;
        }
        .profile-avatar {
          width: 3.2rem;
          height: 3.2rem;
          border-radius: 18px;
          font-size: 1rem;
        }
        .profile-name {
          font-size: 1.2rem;
        }
        .form-section {
          gap: 0.7rem;
          padding: 0.8rem;
        }
      }
    `,
  ],
})
export class SchedulesEditorComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly schedule = input<ScheduleRecord | null>(null);
  readonly executing = input(false);
  readonly canOperate = input(false);

  readonly close = output<void>();
  readonly run = output<void>();

  modeLabel(): string {
    return this.schedule()?.scheduled ? this.i18n.t('status.scheduled') : this.i18n.t('status.manual');
  }

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value) : '-';
  }
}
