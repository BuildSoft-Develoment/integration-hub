// @trace spec 008-mensajeria-pagos RF-007, T-021
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  Mt101RouteRuleDraft,
  Mt101RouteTaskDraft,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskFormModel } from '../../../../../models/process.models';
import { ProcessTaskRuntimePanelComponent } from '@integration-hub/shared/process-form-kit';
import { TaskFormShellComponent } from '@integration-hub/shared/process-form-kit';

@Component({
  selector: 'ih-process-mt101-route-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ProcessTaskRuntimePanelComponent,
    TaskFormShellComponent,
  ],
  templateUrl: './process-mt101-route-task-form.component.html',
  styleUrl: './process-mt101-route-task-form.component.css',
})
export class ProcessMt101RouteTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readonly = input(false);

  readonly draft = computed<Mt101RouteTaskDraft>(
    () => this.manager.draftFor<Mt101RouteTaskDraft>(this.task()),
  );

  updateDraft(patch: Partial<Mt101RouteTaskDraft>): void {
    const next: Mt101RouteTaskDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }

  updateRule(index: number, patch: Partial<Mt101RouteRuleDraft>): void {
    const rules = this.draft().rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule));
    this.updateDraft({ rules });
  }

  addRule(): void {
    const rules: Mt101RouteRuleDraft[] = [
      ...this.draft().rules,
      { name: '', predicate: '', routeTo: '' },
    ];
    this.updateDraft({ rules });
  }

  removeRule(index: number): void {
    const rules = this.draft().rules.filter((_, i) => i !== index);
    this.updateDraft({ rules });
  }
}
