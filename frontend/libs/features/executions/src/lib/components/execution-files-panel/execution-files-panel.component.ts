import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import {
  createEmptyProcessedFileFilters,
  downloadProcessedFilesCsv,
  fileReference,
  filterProcessedFileRows,
  formatFileSize,
} from '../../execution-detail.utils';
import {
  ExecutionFileActionRequest,
  ProcessTaskExecutionRecord,
  ProcessExecutionRecord,
  ProcessedFileFilters,
  ProcessedSourceFileRecord,
} from '../../execution.models';

@Component({
  selector: 'ih-execution-files-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    @if (!task()) {
      <div class="empty-state ih-muted">{{ i18n.t('executions.taskDetailEmpty') }}</div>
    } @else {
      <section class="files-shell">
        <div class="files-toolbar">
          <div class="files-toolbar__chips">
            @for (quickFilter of quickFilters; track quickFilter.value) {
              <button
                mat-stroked-button
                type="button"
                [class.files-toolbar__chip--active]="filters().status === quickFilter.value"
                (click)="setStatusFilter(quickFilter.value)"
              >
                {{ quickFilter.label }}
              </button>
            }
          </div>

          <div class="files-toolbar__actions">
            <button
              mat-stroked-button
              type="button"
              [disabled]="!filteredFiles().length"
              (click)="download('all', filteredFiles())"
            >
              {{ i18n.t('executions.exportFileSummaryCsv') }}
            </button>
            <button
              mat-stroked-button
              type="button"
              [disabled]="!completedFiles().length"
              (click)="download('completed', completedFiles())"
            >
              {{ i18n.t('executions.exportCompletedCsv') }}
            </button>
            <button
              mat-stroked-button
              type="button"
              [disabled]="!failedFiles().length"
              (click)="download('failed', failedFiles())"
            >
              {{ i18n.t('executions.exportFailedCsv') }}
            </button>
            <button
              mat-stroked-button
              type="button"
              [disabled]="!pendingFiles().length"
              (click)="download('pending', pendingFiles())"
            >
              {{ i18n.t('executions.exportPendingCsv') }}
            </button>
          </div>
        </div>

        <div class="files-filters">
          <mat-form-field>
            <mat-label>{{ i18n.t('executions.fileNameSearch') }}</mat-label>
            <input matInput [ngModel]="filters().name" (ngModelChange)="updateFilters({ name: $event })" />
          </mat-form-field>

          <mat-form-field>
            <mat-label>{{ i18n.t('executions.filePathSearch') }}</mat-label>
            <input matInput [ngModel]="filters().path" (ngModelChange)="updateFilters({ path: $event })" />
          </mat-form-field>

          <mat-form-field>
            <mat-label>{{ i18n.t('executions.fileStatusFilter') }}</mat-label>
            <mat-select [ngModel]="filters().status" (ngModelChange)="updateFilters({ status: $event })">
              <mat-option value="">{{ i18n.t('executions.allFileStatuses') }}</mat-option>
              <mat-option value="COMPLETED">COMPLETADO</mat-option>
              <mat-option value="FAILED">FALLIDO</mat-option>
              <mat-option value="PENDING">PENDIENTE</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field>
            <mat-label>{{ i18n.t('executions.fileModifiedFrom') }}</mat-label>
            <input matInput type="datetime-local" [ngModel]="filters().modifiedFrom" (ngModelChange)="updateFilters({ modifiedFrom: $event })" />
          </mat-form-field>

          <mat-form-field>
            <mat-label>{{ i18n.t('executions.fileModifiedTo') }}</mat-label>
            <input matInput type="datetime-local" [ngModel]="filters().modifiedTo" (ngModelChange)="updateFilters({ modifiedTo: $event })" />
          </mat-form-field>

          <mat-form-field>
            <mat-label>{{ i18n.t('executions.fileMinSize') }}</mat-label>
            <input matInput type="number" [ngModel]="filters().minSize" (ngModelChange)="updateFilters({ minSize: $event })" />
          </mat-form-field>

          <mat-form-field>
            <mat-label>{{ i18n.t('executions.fileMaxSize') }}</mat-label>
            <input matInput type="number" [ngModel]="filters().maxSize" (ngModelChange)="updateFilters({ maxSize: $event })" />
          </mat-form-field>
        </div>

        <div class="files-selection">
          <div class="files-selection__copy">
            <strong>{{ i18n.t('executions.selectedFiles') }}: {{ selectedRows().length }}</strong>
            <span class="ih-muted">
              {{ i18n.t('executions.processedFiles') }}: {{ allFiles().length }} ·
              {{ i18n.t('executions.exportCompletedCsv') }} {{ completedFiles().length }} ·
              {{ i18n.t('executions.exportFailedCsv') }} {{ failedFiles().length }} ·
              {{ i18n.t('executions.exportPendingCsv') }} {{ pendingFiles().length }}
            </span>
          </div>

          <div class="files-selection__actions">
            <button
              mat-stroked-button
              type="button"
              [disabled]="actionBusy() || !failedFiles().length || !execution()?.processDefinitionId"
              (click)="emitAction('retryFailed', failedFiles())"
            >
              {{ i18n.t('executions.retryFailedFiles') }}
            </button>
            <button
              mat-stroked-button
              type="button"
              [disabled]="actionBusy() || !pendingFiles().length || !execution()?.processDefinitionId"
              (click)="emitAction('processPending', pendingFiles())"
            >
              {{ i18n.t('executions.processPendingFiles') }}
            </button>
            <button
              mat-flat-button
              type="button"
              color="primary"
              [disabled]="actionBusy() || !selectedRows().length || !execution()?.processDefinitionId"
              (click)="emitAction('reprocessSelected', selectedRows())"
            >
              {{ i18n.t('executions.reprocessSelectedFiles') }}
            </button>
            <button mat-button type="button" (click)="clearFiltersAndSelection()">
              {{ i18n.t('executions.clearFileFilters') }}
            </button>
          </div>
        </div>

        @if (!allFiles().length) {
          <div class="empty-state ih-muted">{{ i18n.t('executions.sourceFilesEmpty') }}</div>
        } @else {
          <div class="files-table">
            <div class="files-table__head">
              <div class="files-table__sel">
                <mat-checkbox
                  [checked]="isAllVisibleSelected()"
                  [indeterminate]="isPartiallySelected()"
                  (change)="toggleAllVisible($event.checked)"
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
              @for (file of filteredFiles(); track rowKey(file)) {
                <div class="files-table__row">
                  <div class="files-table__sel">
                    <mat-checkbox
                      [checked]="isSelected(file)"
                      (change)="toggleRow(file, $event.checked)"
                    />
                  </div>
                  <div class="files-table__file">
                    <strong>{{ file.fileName || '-' }}</strong>
                    <small>{{ file.filePath || '-' }}</small>
                  </div>
                  <div><span class="status-pill" [class]="statusClass(file.status)">{{ file.status || '-' }}</span></div>
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
        }
      </section>
    }
  `,
  styles: [`
    .files-shell { display:grid; gap:1rem; padding-top:0.25rem; }
    .files-toolbar, .files-selection { display:flex; gap:0.75rem; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; }
    .files-toolbar__chips, .files-toolbar__actions, .files-selection__actions { display:flex; flex-wrap:wrap; gap:0.55rem; }
    .files-toolbar__chip--active { border-color:var(--ih-accent); color:var(--ih-accent-strong); }
    .files-filters { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:0.75rem; }
    .files-selection { padding:0.95rem; border:1px solid var(--ih-border); border-radius:18px; background:color-mix(in srgb, var(--ih-surface-alt) 92%, transparent); }
    .files-selection__copy { display:grid; gap:0.25rem; }
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
    .empty-state, .empty-inline { min-height:12rem; display:grid; place-items:center; text-align:center; }
    .empty-inline { min-height:8rem; }
    @media (max-width: 1280px) { .files-filters { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 980px) {
      .files-filters { grid-template-columns:1fr; }
      .files-table { overflow:auto; }
      .files-table__head, .files-table__row { min-width:72rem; }
    }
  `],
})
export class ExecutionFilesPanelComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly execution = input<ProcessExecutionRecord | null>(null);
  readonly task = input<ProcessTaskExecutionRecord | null>(null);
  readonly actionBusy = input(false);
  readonly fileAction = output<ExecutionFileActionRequest>();

  readonly filters = signal<ProcessedFileFilters>(createEmptyProcessedFileFilters());
  readonly selectedKeys = signal<string[]>([]);

  readonly allFiles = computed(() => this.task()?.processedFiles ?? []);
  readonly filteredFiles = computed(() => filterProcessedFileRows(this.allFiles(), this.filters()));
  readonly completedFiles = computed(() => this.filteredFiles().filter((item) => item.status === 'COMPLETED'));
  readonly failedFiles = computed(() => this.filteredFiles().filter((item) => item.status === 'FAILED'));
  readonly pendingFiles = computed(() => this.filteredFiles().filter((item) => item.status === 'PENDING'));
  readonly selectedRows = computed(() => this.filteredFiles().filter((item) => this.selectedKeys().includes(this.rowKey(item))));

  readonly quickFilters = [
    { value: '', label: 'Todos' },
    { value: 'COMPLETED', label: 'Completados' },
    { value: 'FAILED', label: 'Fallidos' },
    { value: 'PENDING', label: 'Pendientes' },
  ];

  constructor() {
    effect(() => {
      this.task()?.id;
      this.filters.set(createEmptyProcessedFileFilters());
      this.selectedKeys.set([]);
    });
  }

  updateFilters(patch: Partial<ProcessedFileFilters>): void {
    this.filters.update((current) => ({ ...current, ...patch }));
  }

  setStatusFilter(status: string): void {
    this.updateFilters({ status });
  }

  clearFiltersAndSelection(): void {
    this.filters.set(createEmptyProcessedFileFilters());
    this.selectedKeys.set([]);
  }

  toggleRow(file: ProcessedSourceFileRecord, checked: boolean): void {
    const key = this.rowKey(file);
    if (!key) {
      return;
    }

    this.selectedKeys.update((current) =>
      checked ? Array.from(new Set([...current, key])) : current.filter((item) => item !== key)
    );
  }

  toggleAllVisible(checked: boolean): void {
    const visibleKeys = this.filteredFiles().map((item) => this.rowKey(item)).filter(Boolean);
    this.selectedKeys.update((current) =>
      checked ? Array.from(new Set([...current, ...visibleKeys])) : current.filter((item) => !visibleKeys.includes(item))
    );
  }

  isSelected(file: ProcessedSourceFileRecord): boolean {
    return this.selectedKeys().includes(this.rowKey(file));
  }

  isAllVisibleSelected(): boolean {
    return this.filteredFiles().length > 0 && this.filteredFiles().every((item) => this.isSelected(item));
  }

  isPartiallySelected(): boolean {
    return this.filteredFiles().some((item) => this.isSelected(item)) && !this.isAllVisibleSelected();
  }

  emitAction(kind: ExecutionFileActionRequest['kind'], files: ProcessedSourceFileRecord[]): void {
    this.fileAction.emit({ kind, files });
  }

  download(kind: 'all' | 'completed' | 'failed' | 'pending', rows: ProcessedSourceFileRecord[]): void {
    const suffix =
      kind === 'completed'
        ? 'archivos-completados'
        : kind === 'failed'
          ? 'archivos-fallidos'
          : kind === 'pending'
            ? 'archivos-pendientes'
            : 'archivos';
    downloadProcessedFilesCsv(rows, `task-execution-${this.task()?.id || 'source-files'}-${suffix}.csv`);
  }

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value) : '-';
  }

  fileSize(value: number | null): string {
    return formatFileSize(value);
  }

  rowKey(file: ProcessedSourceFileRecord): string {
    return fileReference(file) || String(file.id);
  }

  statusClass(status: string | null): string {
    switch (status) {
      case 'COMPLETED':
        return 'status-pill status-pill--completed';
      case 'FAILED':
        return 'status-pill status-pill--failed';
      case 'PENDING':
        return 'status-pill status-pill--pending';
      default:
        return 'status-pill';
    }
  }
}
