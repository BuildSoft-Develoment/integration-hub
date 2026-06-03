// @trace RF-002 (observabilidad: detalle por tarea y por archivo procesado)
import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';

import {
  ExecutionFileActionRequest,
  ExecutionNavigationEntry,
  ProcessExecutionRecord,
  ProcessTaskExecutionRecord,
} from '../../models/execution.models';
import { ExecutionLineageComponent } from '../execution-lineage/execution-lineage.component';
import { ExecutionTaskListComponent } from '../execution-task-list/execution-task-list.component';
import { ExecutionEditorFilesTabComponent } from './execution-editor-files-tab/execution-editor-files-tab.component';
import { ExecutionEditorHeaderComponent } from './execution-editor-header/execution-editor-header.component';
import { ExecutionEditorStore } from './execution-editor.store';
import { ExecutionEditorSummaryComponent } from './execution-editor-summary/execution-editor-summary.component';
import { I18nService } from '@integration-hub/core/services';

@Component({
  selector: 'ih-execution-editor',
  standalone: true,
  providers: [ExecutionEditorStore],
  imports: [
    CommonModule,
    MatButtonModule,
    MatTabsModule,
    ExecutionTaskListComponent,
    ExecutionLineageComponent,
    ExecutionEditorHeaderComponent,
    ExecutionEditorSummaryComponent,
    ExecutionEditorFilesTabComponent,
  ],
    templateUrl: './execution-editor.component.html',
    styleUrl: './execution-editor.component.css'
})
export class ExecutionEditorComponent {
  readonly i18n = inject(I18nService);
  readonly store = inject(ExecutionEditorStore);

  readonly execution = input<ProcessExecutionRecord | null>(null);
  readonly tasks = input<readonly ProcessTaskExecutionRecord[]>([]);
  readonly children = input<readonly ProcessExecutionRecord[]>([]);
  readonly navigationStack = input<readonly ExecutionNavigationEntry[]>([]);
  readonly loading = input(false);
  readonly actionBusy = input(false);
  readonly close = output<void>();
  readonly openExecution = output<number>();
  readonly goBack = output<void>();
  readonly fileAction = output<ExecutionFileActionRequest>();

  constructor() {
    effect(() => {
      this.store.syncContext(this.execution(), this.tasks());
    });
  }
}
