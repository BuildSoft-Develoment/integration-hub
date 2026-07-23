// @trace spec 008-mensajeria-pagos RF-010, T-026
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  Mt101RepairAction,
  Mt101RepairRuleDraft,
  Mt101RepairTaskDraft,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskFormModel } from '../../../../../models/process.models';
import { ProcessTaskRuntimePanelComponent } from '../../../shared/process-task-runtime-panel/process-task-runtime-panel.component';
import { TaskFormShellComponent } from '../../../shared/task-form-shell/task-form-shell.component';

@Component({
  selector: 'ih-process-mt101-repair-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ProcessTaskRuntimePanelComponent,
    TaskFormShellComponent,
  ],
  templateUrl: './process-mt101-repair-task-form.component.html',
  styleUrl: './process-mt101-repair-task-form.component.css',
})
export class ProcessMt101RepairTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readonly = input(false);

  readonly draft = computed<Mt101RepairTaskDraft>(
    () => this.manager.draftFor<Mt101RepairTaskDraft>(this.task()),
  );

  readonly actions: ReadonlyArray<Mt101RepairAction> = [
    'stripNonSwiftXChars',
    'uppercaseField',
    'truncateField',
  ];

  updateDraft(patch: Partial<Mt101RepairTaskDraft>): void {
    const next: Mt101RepairTaskDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }

  updateRepair(index: number, patch: Partial<Mt101RepairRuleDraft>): void {
    const repairs = this.draft().repairs.map((r, i) => (i === index ? { ...r, ...patch } : r));
    this.updateDraft({ repairs });
  }

  addRepair(): void {
    const repairs: Mt101RepairRuleDraft[] = [
      ...this.draft().repairs,
      { action: 'stripNonSwiftXChars', targetFields: '', maxLength: 35 },
    ];
    this.updateDraft({ repairs });
  }

  removeRepair(index: number): void {
    const repairs = this.draft().repairs.filter((_, i) => i !== index);
    this.updateDraft({ repairs });
  }
}
