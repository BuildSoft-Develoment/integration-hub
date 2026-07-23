import { Injectable } from '@angular/core';
import { ProcessTaskFormModel } from '../../../../tasks/process-task.models';
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
        // ${batchCode} (base36 del processExecutionId) hace la referencia unica
        // por EJECUCION; ${messageIndex} la hace unica por fragmento. Asi dos
        // lotes el mismo dia con la misma fecha no chocan en el indice de
        // idempotencia (senders_reference, requested_execution_date). Cabe en
        // 16 chars: batchCode ~4-7 + messageIndex 1-5.
        sendersReferenceTemplate: '${batchCode}${messageIndex}',
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
