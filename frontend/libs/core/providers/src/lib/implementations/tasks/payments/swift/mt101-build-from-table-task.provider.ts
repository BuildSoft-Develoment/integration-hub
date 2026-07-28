import { Injectable } from '@angular/core';
import { ProcessTaskFormModel } from '../../../../tasks/process-task.models';
import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_TRANSACTIONS,
  Mt101BuildTaskDraft,
  Mt101BuildTaskProvider,
} from './mt101-build-task.provider';

@Injectable()
export class Mt101BuildFromTableTaskProvider extends Mt101BuildTaskProvider {
  override readonly descriptor = {
    type: 'MT101_BUILD_FROM_TABLE' as const,
    labelKey: 'processTask.MT101_BUILD_FROM_TABLE',
    descriptionKey: 'processTaskDescription.MT101_BUILD_FROM_TABLE',
    summaryFields: ['fragmentSetId', 'fragmentCount', 'transactionCount', 'totalBytes', 'format'],
    category: 'swift-mt101',
    availableOutputs: ['metadata', 'summary', 'fragments'] as const,
    defaultOutput: 'fragments' as const,
    modalLayout: 'workspace' as const,
  };

  override createDraft(): Mt101BuildTaskDraft {
    const draft = super.createDraft();
    return {
      ...draft,
      executionMode: 'once',
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
    config['maxTransactionsPerMessage'] = draft.maxTransactionsPerMessage || DEFAULT_MAX_TRANSACTIONS;
    // Estas dos las lee el backend y el form NO las expone. Antes se fijaban a la constante en cada guardado,
    // asi que una config con otro valor se reescribia sola — y `replaceExisting: false` volvia a true, lo que
    // BORRA el fragment set anterior. Ahora solo se siembran si no venian (super ya spreadeo lo preservado).
    if (config['maxBytesPerMessage'] === undefined) {
      config['maxBytesPerMessage'] = DEFAULT_MAX_BYTES;
    }
    if (config['replaceExisting'] === undefined) {
      config['replaceExisting'] = true;
    }
    return { configurationJson: this.toPrettyJson(config) };
  }
}
