// @trace spec 008-mensajeria-pagos RF-010, T-024
// @trace ADR-009
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/i18n';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskRuntimeDraft } from '../../tasks/process-task-binding.models';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export type Mt101RepairAction = 'stripNonSwiftXChars' | 'uppercaseField' | 'truncateField';

/** Una accion de reparacion (action + targetFields + params adicionales). */
export interface Mt101RepairRuleDraft {
  action: Mt101RepairAction;
  targetFields: string;
  maxLength: number;
}

/** Draft del formulario MT101_REPAIR. */
export interface Mt101RepairTaskDraft extends ProcessTaskRuntimeDraft {
  repairs: Mt101RepairRuleDraft[];
  newReferenceTemplate: string;
  repairAttempt: number;
}

@Injectable()
export class Mt101RepairTaskProvider extends ProcessTaskProvider<Mt101RepairTaskDraft> {
  readonly descriptor = {
    type: 'MT101_REPAIR' as const,
    labelKey: 'processTask.MT101_REPAIR',
    descriptionKey: 'processTaskDescription.MT101_REPAIR',
    modalLayout: 'workspace' as const,
  };

  createDraft(): Mt101RepairTaskDraft {
    return {
      taskRef: '',
      executionMode: 'once',
      repairs: [
        {
          action: 'stripNonSwiftXChars',
          targetFields: 'transactions.remittanceInformation',
          maxLength: 35,
        },
      ],
      newReferenceTemplate: '',
      repairAttempt: 1,
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): Mt101RepairTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'once');
    const raw = Array.isArray(config['repairs']) ? config['repairs'] : [];
    return {
      ...runtime,
      repairs: raw
        .filter((r) => r && typeof r === 'object')
        .map((r) => ({
          action: this.normalizeAction(r['action']),
          targetFields: Array.isArray(r['targetFields'])
            ? r['targetFields'].join('\n')
            : String(r['targetFields'] || ''),
          maxLength: Number(r['maxLength']) || 35,
        })),
      newReferenceTemplate: String(config['newReferenceTemplate'] || ''),
      repairAttempt: Number(config['repairAttempt']) || 1,
    };
  }

  toTaskPatch(draft: Mt101RepairTaskDraft): Partial<ProcessTaskFormModel> {
    const payload: Record<string, unknown> = this.withRuntime(
      {
        repairs: draft.repairs.map((r) => {
          const fields = r.targetFields
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
          const base: Record<string, unknown> = { action: r.action, targetFields: fields };
          if (r.action === 'truncateField') {
            base['maxLength'] = r.maxLength;
          }
          return base;
        }),
        ...(draft.newReferenceTemplate ? { newReferenceTemplate: draft.newReferenceTemplate } : {}),
        repairAttempt: draft.repairAttempt,
      },
      draft,
      'once',
    );
    return { configurationJson: this.toPrettyJson(payload) };
  }

  override summarize(task: ProcessTaskFormModel, _ctx: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    return [i18n.t(this.descriptor.labelKey), `${config.repairs.length} repair(s)`].join(' | ');
  }

  private normalizeAction(value: unknown): Mt101RepairAction {
    const v = String(value || '');
    if (v === 'uppercaseField' || v === 'truncateField') return v;
    return 'stripNonSwiftXChars';
  }
}
