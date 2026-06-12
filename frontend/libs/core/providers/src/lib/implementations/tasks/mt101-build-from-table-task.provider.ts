import { Injectable } from '@angular/core';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';
import { Mt101BuildTaskDraft, Mt101BuildTaskProvider } from './mt101-build-task.provider';

@Injectable()
export class Mt101BuildFromTableTaskProvider extends Mt101BuildTaskProvider {
  override readonly descriptor = {
    type: 'MT101_BUILD_FROM_TABLE' as const,
    labelKey: 'processTask.MT101_BUILD_FROM_TABLE',
    descriptionKey: 'processTaskDescription.MT101_BUILD_FROM_TABLE',
    modalLayout: 'workspace' as const,
  };

  override createDraft(): Mt101BuildTaskDraft {
    const draft = super.createDraft();
    return {
      ...draft,
      executionMode: 'once',
      maxTransactionsPerMessage: 100,
      sequenceA: {
        ...draft.sequenceA,
        // El default heredado (PROC-${_processExecutionId}) produce el mismo :20:
        // en todos los fragmentos y el backend lo rechaza cuando hay mas de uno.
        // ${messageIndex} garantiza unicidad por fragmento (max 16 chars: "P" + 5n).
        sendersReferenceTemplate: 'P${messageIndex}',
      },
    };
  }

  override toTaskPatch(draft: Mt101BuildTaskDraft): Partial<ProcessTaskFormModel> {
    const patch = super.toTaskPatch(draft);
    const config = this.parseJson(patch.configurationJson as string) as Record<string, unknown>;
    config['maxTransactionsPerMessage'] = draft.maxTransactionsPerMessage || 100;
    config['maxBytesPerMessage'] = 10000;
    config['replaceExisting'] = true;
    return { configurationJson: this.toPrettyJson(config) };
  }
}
