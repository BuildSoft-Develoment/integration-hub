import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ProcessTaskRuntimeDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { SchemaFieldDescriptor } from '@integration-hub/shared/ui';

import { ProcessSchemaFieldContextService } from '../../../forms/process-schema-field-context.service';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';

/**
 * Renderer de campo custom `runtime-panel` para `ih-schema-form`: envuelve
 * {@link ProcessTaskRuntimePanelComponent} y adapta su modelo a un `FormControl` cuyo valor es un
 * {@link ProcessTaskRuntimeDraft} (modo de ejecución + binding de input). task/tasks vienen del
 * {@link ProcessSchemaFieldContextService} publicado por el host.
 */
@Component({
  selector: 'ih-process-runtime-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProcessTaskRuntimePanelComponent],
  template: `
    @if (context.task(); as task) {
      <ih-process-task-runtime-panel
        [task]="task"
        [tasks]="context.tasks()"
        [draft]="draft()"
        [readonly]="readonly()"
        (runtimeChange)="onChange($event)"
      />
    }
  `,
})
export class ProcessRuntimeFieldComponent {
  readonly i18n = inject(I18nService);
  readonly context = inject(ProcessSchemaFieldContextService);

  readonly field = input.required<SchemaFieldDescriptor>();
  readonly control = input.required<FormControl>();
  readonly readonly = input(false);

  readonly draft = computed<ProcessTaskRuntimeDraft>(() => {
    const value = this.control().value as ProcessTaskRuntimeDraft | null;
    if (value && typeof value === 'object') {
      return value;
    }
    return { taskRef: this.context.task()?.clientId ?? '', executionMode: 'once' };
  });

  onChange(patch: Partial<ProcessTaskRuntimeDraft>): void {
    if (this.readonly()) {
      return;
    }
    const next = { ...this.draft(), ...patch };
    this.control().setValue(next);
    this.control().markAsDirty();
  }
}
