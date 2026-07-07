// @trace spec 008-mensajeria-pagos RF-002, T-007
// @trace ADR-009
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/i18n';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskRuntimeDraft } from '../../tasks/process-task-binding.models';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export type Mt101ValidateStandard = 'SWIFT' | 'ISO20022' | 'OPENBANKING' | '*';
export type Mt101ValidateSeverity = 'ERROR' | 'WARNING' | 'INFO';

/** Draft del formulario MT101_VALIDATE. */
export interface Mt101ValidateTaskDraft extends ProcessTaskRuntimeDraft {
  ruleSet: string;
  standard: Mt101ValidateStandard;
  appliesTo: string;
  businessCalendar: string;
  failOn: Mt101ValidateSeverity;
  publishIssuesConnectionRef: string;
  publishIssuesTable: string;
}

/**
 * Provider del task type {@code MT101_VALIDATE}: convierte entre el draft del
 * formulario y el {@code configuration_json}.
 */
@Injectable()
export class Mt101ValidateTaskProvider extends ProcessTaskProvider<Mt101ValidateTaskDraft> {
  readonly descriptor = {
    type: 'MT101_VALIDATE' as const,
    labelKey: 'processTask.MT101_VALIDATE',
    descriptionKey: 'processTaskDescription.MT101_VALIDATE',
    modalLayout: 'workspace' as const,
  };

  createDraft(): Mt101ValidateTaskDraft {
    return {
      taskRef: '',
      executionMode: 'once',
      ruleSet: 'structural-mvp',
      standard: 'SWIFT',
      appliesTo: 'MT101',
      businessCalendar: 'PE',
      failOn: 'ERROR',
      publishIssuesConnectionRef: '',
      publishIssuesTable: 'mt101_validation_issue',
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): Mt101ValidateTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'once');
    const { connRef, table } = this.parsePublishIssuesTo(String(config['publishIssuesTo'] || ''));
    return {
      ...runtime,
      executionMode: 'once',
      ruleSet: String(config['ruleSet'] || 'structural-mvp'),
      standard: this.normalizeStandard(config['standard']),
      appliesTo: String(config['appliesTo'] || 'MT101'),
      businessCalendar: String(config['businessCalendar'] || 'PE'),
      failOn: this.normalizeFailOn(config['failOn']),
      publishIssuesConnectionRef: connRef,
      publishIssuesTable: table || 'mt101_validation_issue',
    };
  }

  toTaskPatch(draft: Mt101ValidateTaskDraft): Partial<ProcessTaskFormModel> {
    const publishIssuesTo = draft.publishIssuesConnectionRef && draft.publishIssuesTable
      ? `table:${draft.publishIssuesConnectionRef}:${draft.publishIssuesTable}`
      : undefined;
    const payload: Record<string, unknown> = this.withRuntime(
      {
        rules: ['__catalog__'],
        ruleSet: draft.ruleSet,
        standard: draft.standard,
        appliesTo: draft.appliesTo,
        businessCalendar: draft.businessCalendar,
        failOn: draft.failOn,
        ...(publishIssuesTo ? { publishIssuesTo } : {}),
      },
      draft,
      'once',
    );
    return { configurationJson: this.toPrettyJson(payload) };
  }

  override summarize(task: ProcessTaskFormModel, _context: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    return [
      i18n.t(this.descriptor.labelKey),
      `${config.standard}/${config.appliesTo} ruleSet=${config.ruleSet} failOn=${config.failOn}`,
    ].join(' | ');
  }

  // --- helpers ---

  private parsePublishIssuesTo(value: string): { connRef: string; table: string } {
    if (!value.startsWith('table:')) {
      return { connRef: '', table: '' };
    }
    const parts = value.substring('table:'.length).split(':');
    return { connRef: parts[0] || '', table: parts[1] || '' };
  }

  private normalizeStandard(value: unknown): Mt101ValidateStandard {
    const v = String(value || 'SWIFT').toUpperCase();
    return v === 'ISO20022' || v === 'OPENBANKING' || v === '*' ? (v as Mt101ValidateStandard) : 'SWIFT';
  }

  private normalizeFailOn(value: unknown): Mt101ValidateSeverity {
    const v = String(value || 'ERROR').toUpperCase();
    return v === 'WARNING' || v === 'INFO' ? (v as Mt101ValidateSeverity) : 'ERROR';
  }
}
