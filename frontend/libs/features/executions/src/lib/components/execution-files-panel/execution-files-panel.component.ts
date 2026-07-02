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
  styleUrl: './execution-files-panel.component.css',
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
