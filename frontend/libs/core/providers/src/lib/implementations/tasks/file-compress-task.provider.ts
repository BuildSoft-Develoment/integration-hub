// @trace ADR-016 (procesos: contrato configuration_json de la tarea FILE_COMPRESS)
import { Injectable } from '@angular/core';
import { ProcessTaskRuntimeDraft } from '../../tasks/process-task-binding.models';
import { ProcessTaskProvider } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export type FileCompressAlgorithm = 'ZIP' | 'GZIP';
export type FileCompressEncryption = 'NONE' | 'AES256';

export interface FileCompressTaskDraft extends ProcessTaskRuntimeDraft {
  algorithm: FileCompressAlgorithm;
  compressionLevel: string;
  encryption: FileCompressEncryption;
  password: string;
  archiveNameTemplate: string;
  entryNameTemplate: string;
  deleteSourcesAfter: boolean;
}

@Injectable()
export class FileCompressTaskProvider extends ProcessTaskProvider<FileCompressTaskDraft> {
  readonly descriptor = {
    type: 'FILE_COMPRESS' as const,
    labelKey: 'processTask.FILE_COMPRESS',
    descriptionKey: 'processTaskDescription.FILE_COMPRESS',
    modalLayout: 'workspace' as const,
  };

  createDraft(): FileCompressTaskDraft {
    return {
      taskRef: '',
      executionMode: 'once',
      algorithm: 'ZIP',
      compressionLevel: 'NORMAL',
      encryption: 'NONE',
      password: '',
      archiveNameTemplate: '',
      entryNameTemplate: '${originalName}',
      deleteSourcesAfter: false,
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): FileCompressTaskDraft {
    const config: any = this.parseJson(task.configurationJson);
    return {
      ...this.hydrateRuntime(task, 'once'),
      algorithm: config.algorithm === 'GZIP' ? 'GZIP' : 'ZIP',
      compressionLevel: String(config.compressionLevel || 'NORMAL'),
      encryption: config.encryption === 'AES256' ? 'AES256' : 'NONE',
      password: String(config.password || ''),
      archiveNameTemplate: String(config.archiveNameTemplate || ''),
      entryNameTemplate: String(config.entryNameTemplate || '${originalName}'),
      deleteSourcesAfter: config.deleteSourcesAfter === true,
    };
  }

  toTaskPatch(draft: FileCompressTaskDraft): Partial<ProcessTaskFormModel> {
    const payload: any = this.withRuntime(
      {
        algorithm: draft.algorithm,
        compressionLevel: draft.compressionLevel,
        entryNameTemplate: draft.entryNameTemplate || '${originalName}',
        deleteSourcesAfter: draft.deleteSourcesAfter,
        ...(draft.archiveNameTemplate?.trim() ? { archiveNameTemplate: draft.archiveNameTemplate.trim() } : {}),
        ...(draft.encryption !== 'NONE' ? { encryption: draft.encryption, password: draft.password } : {}),
      },
      draft,
      'once',
    );
    // FILE_COMPRESS es once-task; el output de la tarea previa es siempre `summary`.
    payload.executionMode = 'once';
    if (payload.input) {
      payload.input.sourceOutput = 'summary';
    }
    return { configurationJson: this.toPrettyJson(payload) };
  }
}
