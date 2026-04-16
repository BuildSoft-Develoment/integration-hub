import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { DateTimeService, I18nService } from '@integration-hub/core/services';

import { formatFileSize } from '../../execution-detail.utils';
import { ProcessedSourceFileRecord } from '../../execution.models';

@Component({
  selector: 'ih-execution-files-table',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule],
  template: `
    <div class="files-table">
      <div class="files-table__head">
        <div class="files-table__sel">
          <mat-checkbox
            [checked]="allVisibleSelected()"
            [indeterminate]="partiallySelected()"
            (change)="toggleAllVisible.emit($event.checked)"
          />
        </div>
        <span>Archivo</span>
        <span>{{ i18n.t('common.status') }}</span>
        <span>Validos</span>
        <span>Omitidos</span>
        <span>Escritos</span>
        <span>Tamano</span>
        <span>{{ i18n.t('executions.fileModifiedTo') }}</span>
      </div>

      <div class="files-table__body">
        @for (file of files(); track rowKey()(file)) {
          <div class="files-table__row">
            <div class="files-table__sel">
              <mat-checkbox
                [checked]="selectedKeys().includes(rowKey()(file))"
                (change)="toggleRow.emit({ file, checked: $event.checked })"
              />
            </div>
            <div class="files-table__file">
              <strong>{{ file.fileName || '-' }}</strong>
              <small>{{ file.filePath || '-' }}</small>
            </div>
            <div><span class="status-pill" [class]="statusClass()(file.status)">{{ file.status || '-' }}</span></div>
            <span>{{ file.recordCount ?? '-' }}</span>
            <span>{{ file.skippedCount ?? '-' }}</span>
            <span>{{ file.writtenCount ?? '-' }}</span>
            <span>{{ fileSize(file.fileSize) }}</span>
            <div class="files-table__date">
              <span>{{ formatDate(file.lastModified) }}</span>
              @if (file.errorMessage) {
                <small class="files-table__error">{{ file.errorMessage }}</small>
              }
            </div>
          </div>
        } @empty {
          <div class="empty-inline ih-muted">{{ i18n.t('executions.noMatchingFiles') }}</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .files-table { border:1px solid var(--ih-border); border-radius:18px; overflow:hidden; background:color-mix(in srgb, var(--ih-surface-alt) 88%, transparent); }
    .files-table__head, .files-table__row { display:grid; grid-template-columns:4rem minmax(18rem, 2fr) 9rem 6rem 6rem 6rem 7rem minmax(10rem, 1fr); gap:0.75rem; align-items:center; }
    .files-table__head { padding:0.85rem 1rem; font-size:0.78rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--ih-text-soft); background:color-mix(in srgb, var(--ih-surface) 90%, transparent); }
    .files-table__body { display:grid; }
    .files-table__row { padding:0.9rem 1rem; border-top:1px solid color-mix(in srgb, var(--ih-border) 82%, transparent); }
    .files-table__sel { display:flex; justify-content:center; }
    .files-table__file, .files-table__date { display:grid; gap:0.2rem; min-width:0; }
    .files-table__file strong, .files-table__file small, .files-table__date span, .files-table__date small { overflow-wrap:anywhere; }
    .files-table__file small, .files-table__date small { color:var(--ih-text-soft); }
    .files-table__error { color:var(--ih-error); }
    .status-pill { display:inline-flex; align-items:center; justify-content:center; min-width:7rem; padding:0.3rem 0.65rem; border-radius:999px; font-size:0.75rem; font-weight:700; }
    .status-pill--completed { background:color-mix(in srgb, #16a34a 14%, transparent); color:#166534; }
    .status-pill--failed { background:color-mix(in srgb, #dc2626 14%, transparent); color:#991b1b; }
    .status-pill--pending { background:color-mix(in srgb, #f59e0b 18%, transparent); color:#9a6700; }
    .empty-inline { min-height:8rem; display:grid; place-items:center; text-align:center; }
    @media (max-width: 980px) {
      .files-table { overflow:auto; }
      .files-table__head, .files-table__row { min-width:72rem; }
    }
  `],
})
export class ExecutionFilesTableComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly files = input.required<readonly ProcessedSourceFileRecord[]>();
  readonly selectedKeys = input<readonly string[]>([]);
  readonly allVisibleSelected = input(false);
  readonly partiallySelected = input(false);
  readonly statusClass = input.required<(status: string | null) => string>();
  readonly rowKey = input.required<(file: ProcessedSourceFileRecord) => string>();
  readonly toggleRow = output<{
    file: ProcessedSourceFileRecord;
    checked: boolean;
  }>();
  readonly toggleAllVisible = output<boolean>();

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value) : '-';
  }

  fileSize(value: number | null): string {
    return formatFileSize(value);
  }
}
