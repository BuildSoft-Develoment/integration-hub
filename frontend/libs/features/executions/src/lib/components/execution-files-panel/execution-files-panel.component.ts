import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { I18nService } from '@integration-hub/core/services';

import { downloadProcessedFilesCsv } from '../../details/execution-detail.utils';
import {
  ExecutionFileActionRequest,
  ProcessTaskExecutionRecord,
  ProcessExecutionRecord,
  ProcessedSourceFileRecord,
} from '../../models/execution.models';
import { ExecutionFilesTableComponent } from './execution-files-table/execution-files-table.component';
import { ExecutionFilesPanelStore } from './execution-files-panel.store';

@Component({
  selector: 'ih-execution-files-panel',
  standalone: true,
  providers: [ExecutionFilesPanelStore],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ExecutionFilesTableComponent,
  ],
  styles: [`
    .files-shell { display:grid; gap:1rem; padding-top:0.25rem; }
    .files-toolbar, .files-selection { display:flex; gap:0.75rem; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; }
    .files-toolbar__chips, .files-toolbar__actions, .files-selection__actions { display:flex; flex-wrap:wrap; gap:0.55rem; }
    .files-toolbar__chip--active { border-color:var(--ih-accent); color:var(--ih-accent-strong); }
    .files-filters { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:0.75rem; }
    .files-selection { padding:0.95rem; border:1px solid var(--ih-border); border-radius:18px; background:color-mix(in srgb, var(--ih-surface-alt) 92%, transparent); }
    .files-selection__copy { display:grid; gap:0.25rem; }
    .empty-state, .empty-inline { min-height:12rem; display:grid; place-items:center; text-align:center; }
    .empty-inline { min-height:8rem; }
    @media (max-width: 1280px) { .files-filters { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 980px) { .files-filters { grid-template-columns:1fr; } }
  `],
    templateUrl: './execution-files-panel.component.html'
})
export class ExecutionFilesPanelComponent {
  readonly i18n = inject(I18nService);
  readonly store = inject(ExecutionFilesPanelStore);

  readonly execution = input<ProcessExecutionRecord | null>(null);
  readonly task = input<ProcessTaskExecutionRecord | null>(null);
  readonly actionBusy = input(false);
  readonly fileAction = output<ExecutionFileActionRequest>();

  constructor() {
    effect(() => {
      this.store.syncTask(this.task());
    });
  }

  emitAction(
    kind: ExecutionFileActionRequest['kind'],
    files: ProcessedSourceFileRecord[]
  ): void {
    this.fileAction.emit({ kind, files });
  }

  download(
    kind: 'all' | 'completed' | 'failed' | 'pending',
    rows: ProcessedSourceFileRecord[]
  ): void {
    const suffix =
      kind === 'completed'
        ? 'archivos-completados'
        : kind === 'failed'
          ? 'archivos-fallidos'
          : kind === 'pending'
            ? 'archivos-pendientes'
            : 'archivos';
    downloadProcessedFilesCsv(
      rows,
      `task-execution-${this.task()?.id || 'source-files'}-${suffix}.csv`
    );
  }
}
