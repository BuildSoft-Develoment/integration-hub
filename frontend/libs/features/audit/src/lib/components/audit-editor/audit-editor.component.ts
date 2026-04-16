import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@integration-hub/core/services';

import { AuditPresentationService } from '../../audit-presentation.service';
import { AuditRecord } from '../../audit.models';

@Component({
  selector: 'ih-audit-editor',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <section class="panel-card ih-drawer-editor">
      <div class="panel-body ih-drawer-editor__body">
        <div class="panel-topbar">
          <button mat-stroked-button type="button" (click)="close.emit()">{{ i18n.t('common.close') }}</button>
        </div>

        @if (event()) {
          <div class="profile-stack">
            <div class="profile-header">
              <div class="profile-avatar">{{ eventLabel(event()!).slice(0, 1).toUpperCase() }}</div>
              <div class="profile-copy">
                <h3 class="profile-name">{{ eventLabel(event()!) }}</h3>
                <p class="profile-subtitle">#{{ event()!.id }} · {{ statusLabel(event()!.status) }}</p>
                @if (event()!.taskType || event()!.taskDefinitionId != null) {
                  <p class="profile-subtitle">{{ taskLabel(event()!) }}</p>
                }
                <p class="profile-subtitle profile-subtitle--technical">{{ event()!.eventType }}</p>
              </div>
            </div>
          </div>

          <section class="form-section">
            <div class="section-header">
              <p class="section-eyebrow">{{ i18n.t('ui.overview') }}</p>
              <h4>{{ i18n.t('audit.detail') }}</h4>
            </div>
            <div class="detail-grid">
              <div><strong>{{ i18n.t('audit.executionId') }}</strong>: {{ event()!.processExecutionId ?? '-' }}</div>
              <div><strong>{{ i18n.t('audit.taskType') }}</strong>: {{ taskTypeDescription(event()!.taskType) }}</div>
              <div><strong>{{ i18n.t('audit.taskDefinitionId') }}</strong>: {{ event()!.taskDefinitionId ?? '-' }}</div>
              <div><strong>{{ i18n.t('common.status') }}</strong>: {{ statusLabel(event()!.status) }}</div>
              <div><strong>{{ i18n.t('audit.createdAt') }}</strong>: {{ formatDate(event()!.createdAt) }}</div>
              <div><strong>{{ i18n.t('audit.eventType') }}</strong>: {{ eventLabel(event()!) }}</div>
            </div>
            @if (event()!.message) {
              <div class="detail-block">
                <strong>{{ i18n.t('audit.message') }}</strong>
                <p>{{ event()!.message }}</p>
              </div>
            }
          </section>

          @if (event()!.payloadJson) {
            <section class="form-section">
              <div class="section-header">
                <p class="section-eyebrow">{{ i18n.t('ui.configSection') }}</p>
                <h4>{{ i18n.t('audit.payloadJson') }}</h4>
              </div>
              <pre>{{ prettyPayload() }}</pre>
            </section>
          }

          <section class="form-section">
            <div class="section-header">
              <p class="section-eyebrow">{{ i18n.t('audit.processedFiles') }}</p>
              <h4>{{ i18n.t('audit.processedFiles') }}</h4>
            </div>
            <div class="file-list">
              @for (file of event()!.processedFiles; track file.id) {
                <div class="file-row">
                  <div class="file-copy">
                    <strong>{{ file.fileName || '-' }}</strong>
                    <small>{{ file.filePath || file.mediaType || '-' }}</small>
                  </div>
                  <div class="file-meta">
                    <span>{{ file.status || '-' }}</span>
                    <small>{{ file.recordCount ?? 0 }}/{{ file.writtenCount ?? 0 }}</small>
                  </div>
                </div>
              } @empty {
                <div class="empty-inline ih-muted">{{ i18n.t('audit.noFiles') }}</div>
              }
            </div>
          </section>
        } @else {
          <div class="empty-state ih-muted">{{ i18n.t('audit.emptySelection') }}</div>
        }
      </div>
    </section>
  `,
  styles: [`
    .panel-card { min-height:100%; height:100%; }
    .panel-body { min-height:100%; display:grid; align-content:start; padding:1rem; overflow:auto; }
    .panel-topbar { display:flex; justify-content:flex-end; margin-bottom:0.65rem; }
    .profile-stack { display:grid; gap:0.8rem; margin-bottom:1rem; }
    .profile-header { display:flex; align-items:center; gap:1rem; min-width:0; }
    .profile-avatar { display:grid; place-items:center; width:4rem; height:4rem; border-radius:22px; background:color-mix(in srgb, var(--ih-accent) 14%, transparent); color:var(--ih-accent-strong); font-size:1.2rem; font-weight:800; }
    .profile-copy { display:grid; gap:0.28rem; min-width:0; }
    .section-eyebrow { margin:0; font-size:0.74rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--ih-text-soft); }
    .profile-name { margin:0; font-size:1.45rem; font-weight:700; letter-spacing:-0.03em; overflow-wrap:anywhere; }
    .profile-subtitle { margin:0; color:var(--ih-text-soft); overflow-wrap:anywhere; }
    .profile-subtitle--technical { font-size:0.8rem; opacity:0.8; }
    .form-section { display:grid; gap:0.9rem; padding:0.95rem; border:1px solid var(--ih-border); border-radius:18px; background:color-mix(in srgb, var(--ih-surface-alt) 93%, transparent); min-width:0; margin-bottom:0.9rem; }
    .section-header h4 { margin:0.28rem 0 0; font-size:1rem; overflow-wrap:anywhere; }
    .detail-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.7rem; }
    .detail-block { display:grid; gap:0.4rem; }
    .detail-block p { margin:0; line-height:1.5; }
    pre { margin:0; padding:0.85rem; border-radius:14px; overflow:auto; background:color-mix(in srgb, var(--ih-surface) 92%, #0f172a 8%); }
    .file-list { display:grid; }
    .file-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:0.75rem; align-items:center; padding:0.75rem 0; border-bottom:1px solid color-mix(in srgb, var(--ih-border) 78%, transparent); }
    .file-row:last-child { border-bottom:0; }
    .file-copy, .file-meta { display:grid; gap:0.18rem; }
    .file-copy small, .file-meta small { color:var(--ih-text-soft); }
    .file-meta { justify-items:end; text-align:right; }
    .empty-state { min-height:20rem; display:grid; place-items:center; text-align:center; }
    .empty-inline { padding:0.35rem 0; }
    @media (max-width: 900px) { .detail-grid, .file-row { grid-template-columns:1fr; } .file-meta { justify-items:start; text-align:left; } }
  `],
})
export class AuditEditorComponent {
  readonly i18n = inject(I18nService);
  readonly presentation = inject(AuditPresentationService);

  readonly event = input<AuditRecord | null>(null);
  readonly close = output<void>();

  readonly prettyPayload = computed(() => {
    const value = this.event()?.payloadJson;
    if (!value) {
      return '';
    }
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  });

  statusLabel(status: string): string {
    return this.presentation.statusLabel(status);
  }

  formatDate(value: string | null): string {
    return this.presentation.formatDate(value);
  }

  eventLabel(event: AuditRecord): string {
    return this.presentation.eventLabel(event.eventType);
  }

  taskLabel(event: AuditRecord): string {
    return this.presentation.taskLabel(event);
  }

  taskTypeDescription(taskType: string | null): string {
    return this.presentation.taskTypeDescription(taskType);
  }
}
