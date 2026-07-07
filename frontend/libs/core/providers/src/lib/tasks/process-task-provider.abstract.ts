import { I18nService } from '@integration-hub/core/i18n';
import {
  ProcessTaskExecutionMode,
  ProcessTaskInputDraft,
  ProcessTaskOutputKind,
  ProcessTaskRuntimeDraft,
} from './process-task-binding.models';
import { ConnectionRef, ProcessTaskFormModel, ProcessTaskType, ReaderRef, SourceRef } from './process-task.models';

export interface ProcessTaskSummaryContext {
  sources: readonly SourceRef[];
  readers: readonly ReaderRef[];
  connections: readonly ConnectionRef[];
}

export interface ProcessTaskProviderDescriptor {
  type: ProcessTaskType;
  labelKey: string;
  descriptionKey: string;
  modalLayout?: 'workspace' | 'rest';
}

export abstract class ProcessTaskProvider<TDraft> {
  abstract readonly descriptor: ProcessTaskProviderDescriptor;

  supports(type: ProcessTaskType): boolean {
    return this.descriptor.type === type;
  }

  abstract createDraft(): TDraft;

  abstract hydrateDraft(task: ProcessTaskFormModel): TDraft;

  abstract toTaskPatch(draft: TDraft): Partial<ProcessTaskFormModel>;

  summarize(task: ProcessTaskFormModel, _context: ProcessTaskSummaryContext, i18n: I18nService): string {
    return i18n.t(this.descriptor.labelKey);
  }

  protected parseJson(configurationJson: string): Record<string, any> {
    try {
      const parsed = JSON.parse(configurationJson || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  protected toPrettyJson(payload: Record<string, unknown>): string {
    return JSON.stringify(payload, null, 2);
  }

  protected hydrateRuntime(task: ProcessTaskFormModel, defaultExecutionMode: ProcessTaskExecutionMode): ProcessTaskRuntimeDraft {
    const config = this.parseJson(task.configurationJson);
    return {
      taskRef: String(config['taskRef'] || task.clientId || `task-${task.taskOrder}`),
      executionMode: this.normalizeExecutionMode(config['executionMode'], defaultExecutionMode),
      input: this.normalizeInput(config['input']),
      // Solo se incluyen cuando estan activos: un draft sincrono queda identico que antes (roundtrip).
      ...(config['async'] === true ? { async: true } : {}),
      ...(config['asyncTransport'] != null && String(config['asyncTransport']).trim()
        ? { asyncTransport: String(config['asyncTransport']) }
        : {}),
      ...(config['continueOnFailure'] === true ? { continueOnFailure: true } : {}),
    };
  }

  protected withRuntime(payload: Record<string, unknown>, draft: Partial<ProcessTaskRuntimeDraft>, defaultExecutionMode: ProcessTaskExecutionMode): Record<string, unknown> {
    const taskRef = String(draft.taskRef || '').trim();
    const executionMode = this.normalizeExecutionMode(draft.executionMode, defaultExecutionMode);
    const input = this.normalizeInput(draft.input);
    const next: Record<string, unknown> = {
      taskRef,
      executionMode,
      ...payload,
    };
    // Despacho async (ADR-015): solo se escribe cuando esta activo (async=false = sincrono = ausente,
    // para no ensuciar la config). `transport`/`continueOnFailure` acompañan solo si async.
    if (draft.async) {
      next['async'] = true;
      const asyncTransport = String(draft.asyncTransport || '').trim();
      if (asyncTransport) {
        next['asyncTransport'] = asyncTransport;
      }
    }
    // continueOnFailure es politica de tarea GENERAL (el motor sincrono la lee para cualquier tarea):
    // se persiste independiente de async. No anidarla bajo async (bug detectado en el doble check).
    if (draft.continueOnFailure) {
      next['continueOnFailure'] = true;
    }
    if (input?.sourceTaskRef) {
      next['input'] = {
        source: 'task-output',
        sourceTaskRef: input.sourceTaskRef,
        sourceOutput: input.sourceOutput,
        ...(input.batchSize ? { batchSize: Number(input.batchSize) } : {}),
        ...(input.connectionRef ? { connectionRef: input.connectionRef } : {}),
        ...(input.table ? { table: input.table } : {}),
      };
    }
    return next;
  }

  private normalizeExecutionMode(value: unknown, fallback: ProcessTaskExecutionMode): ProcessTaskExecutionMode {
    const normalized = String(value || fallback).trim().toLowerCase();
    return normalized === 'once' || normalized === 'per-record' || normalized === 'batch'
      ? normalized
      : fallback;
  }

  private normalizeInput(value: unknown): ProcessTaskInputDraft | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    const raw = value as Record<string, unknown>;
    const sourceTaskRef = String(raw['sourceTaskRef'] || '').trim();
    if (!sourceTaskRef) {
      return undefined;
    }
    return {
      source: 'task-output',
      sourceTaskRef,
      sourceOutput: this.normalizeSourceOutput(raw['sourceOutput']),
      ...(raw['batchSize'] != null && String(raw['batchSize']).trim() ? { batchSize: String(raw['batchSize']) } : {}),
      ...(raw['connectionRef'] != null && String(raw['connectionRef']).trim() ? { connectionRef: String(raw['connectionRef']) } : {}),
      ...(raw['table'] != null && String(raw['table']).trim() ? { table: String(raw['table']) } : {}),
    };
  }

  private normalizeSourceOutput(value: unknown): ProcessTaskOutputKind {
    const normalized = String(value || 'records').trim().toLowerCase();
    return normalized === 'metadata'
      || normalized === 'summary'
      || normalized === 'records'
      || normalized === 'table'
      || normalized === 'errors'
      || normalized === 'out'
      || normalized === 'fragments'
      ? normalized
      : 'records';
  }
}
