// @trace ADR-016 (procesos: contrato configuration_json de la tarea FILE_DELIVER)
import { Injectable } from '@angular/core';
import { ProcessTaskRuntimeDraft } from '../../tasks/process-task-binding.models';
import { ProcessTaskProvider } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export interface FileDeliverTaskDraft extends ProcessTaskRuntimeDraft {
  sinkRef: string;
  dropPathTemplate: string;
}

@Injectable()
export class FileDeliverTaskProvider extends ProcessTaskProvider<FileDeliverTaskDraft> {
  readonly descriptor = {
    type: 'FILE_DELIVER' as const,
    labelKey: 'processTask.FILE_DELIVER',
    descriptionKey: 'processTaskDescription.FILE_DELIVER',
    modalLayout: 'workspace' as const,
  };

  createDraft(): FileDeliverTaskDraft {
    return { taskRef: '', executionMode: 'once', sinkRef: '', dropPathTemplate: '${originalName}' };
  }

  hydrateDraft(task: ProcessTaskFormModel): FileDeliverTaskDraft {
    const config: any = this.parseJson(task.configurationJson);
    return {
      ...this.hydrateRuntime(task, 'once'),
      sinkRef: config.sinkRef != null ? String(config.sinkRef) : '',
      dropPathTemplate: String(config.dropPathTemplate || '${originalName}'),
    };
  }

  toTaskPatch(draft: FileDeliverTaskDraft): Partial<ProcessTaskFormModel> {
    // sinkRef llega como number desde el mat-select -> coercion a string antes de operar (evita number.trim()).
    const sinkRef = String(draft.sinkRef ?? '').trim();
    const payload: any = this.withRuntime(
      {
        ...(sinkRef ? { sinkRef: Number(sinkRef) } : {}),
        dropPathTemplate: draft.dropPathTemplate || '${originalName}',
      },
      draft,
      'once',
    );
    // FILE_DELIVER es once-task en el backend; el output de la tarea previa es siempre `summary`.
    payload.executionMode = 'once';
    if (payload.input) {
      payload.input.sourceOutput = 'summary';
    }
    return { configurationJson: this.toPrettyJson(payload) };
  }
}
