import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@integration-hub/core/services';
import { ProcessFlowLayout } from '../../models/process-flow.models';
import { ConnectionRef, ProcessFormModel, ProcessTaskFormModel, ProcessTaskType, ReaderRef, SourceRef } from '../../models/process.models';
import { ProcessEditorActionsComponent } from './process-editor-actions/process-editor-actions.component';
import { ProcessEditorHeaderComponent } from './process-editor-header/process-editor-header.component';
import { ProcessEditorOverviewComponent } from './process-editor-overview/process-editor-overview.component';
import { ProcessTaskListComponent } from '../process-task-list/process-task-list.component';

@Component({
  selector: 'ih-process-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    ProcessEditorActionsComponent,
    ProcessEditorHeaderComponent,
    ProcessEditorOverviewComponent,
    ProcessTaskListComponent,
  ],
    templateUrl: './process-editor.component.html',
    styleUrl: './process-editor.component.css'
})
export class ProcessEditorComponent {
  readonly i18n = inject(I18nService);

  readonly form = input.required<ProcessFormModel>();
  readonly sources = input.required<readonly SourceRef[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly saving = input(false);
  readonly executing = input(false);
  readonly titleKey = input.required<string>();
  readonly readonly = input(false);
  readonly canEdit = input(false);
  readonly canOperate = input(false);

  readonly patchForm = output<Partial<ProcessFormModel>>();
  readonly flowLayoutChange = output<ProcessFlowLayout>();
  readonly flowStateChange = output<{ layout: ProcessFlowLayout; tasks: ProcessTaskFormModel[] }>();
  readonly addTask = output<ProcessTaskType>();
  readonly addTaskAt = output<{ taskType: ProcessTaskType; position?: { x: number; y: number } }>();
  readonly patchTask = output<{ clientId: string; patch: Partial<ProcessTaskFormModel> }>();
  readonly removeTask = output<string>();
  readonly save = output<void>();
  readonly cancel = output<void>();
  readonly close = output<void>();
  readonly edit = output<void>();
  readonly toggleActive = output<void>();
  readonly execute = output<void>();
}
