import { I18nService } from '@integration-hub/core/i18n';
import {
  ProcessTaskProvider,
  ProcessTaskProviderDescriptor,
  ProcessTaskSummaryContext,
} from '../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export interface RemoteTaskCatalogItem {
  readonly type: string;
  readonly origin?: string;
  readonly provider?: string;
  readonly pluginId?: string | null;
  readonly pluginVersion?: string | null;
  readonly transport?: string | null;
  readonly status?: string | null;
  readonly reason?: string | null;
}

interface RemoteTaskDraft {
  readonly taskRef?: string;
  readonly executionMode?: 'once';
}

/**
 * Adaptador frontend para task types remotos publicados por backend.
 *
 * No trae un formulario hardcoded: `ProcessTaskFormHostComponent` consulta el
 * config-schema del backend y renderiza `ih-schema-form`. Este provider solo hace
 * visible la capacidad en la paleta/editor y produce una configuracion inicial
 * minima, manteniendo OCP para plugins instalados fuera del build Angular.
 */
export class RemoteSchemaTaskProvider extends ProcessTaskProvider<RemoteTaskDraft> {
  readonly descriptor: ProcessTaskProviderDescriptor;

  constructor(item: RemoteTaskCatalogItem) {
    super();
    const type = normalizeType(item.type);
    this.descriptor = {
      type,
      labelKey: `processTask.remote.${type}`,
      descriptionKey: `processTask.remote.${type}.description`,
      label: humanizeRemoteType(type),
      modalLayout: 'workspace',
      origin: 'REMOTE',
      pluginId: item.pluginId ?? null,
      pluginVersion: item.pluginVersion ?? null,
      transport: item.transport ?? null,
      status: normalizeStatus(item.status),
      reason: item.reason ?? null,
    };
  }

  createDraft(): RemoteTaskDraft {
    return {
      taskRef: '',
      executionMode: 'once',
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): RemoteTaskDraft {
    try {
      const parsed = JSON.parse(task.configurationJson || '{}');
      return {
        taskRef: typeof parsed?.taskRef === 'string' ? parsed.taskRef : task.clientId,
        executionMode: 'once',
      };
    } catch {
      return {
        taskRef: task.clientId,
        executionMode: 'once',
      };
    }
  }

  toTaskPatch(draft: RemoteTaskDraft): Partial<ProcessTaskFormModel> {
    return {
      configurationJson: JSON.stringify({
        taskRef: draft.taskRef ?? '',
        executionMode: 'once',
      }, null, 2),
    };
  }

  override summarize(
    task: ProcessTaskFormModel,
    _context: ProcessTaskSummaryContext,
    _i18n: I18nService,
  ): string {
    const status = this.descriptor.status && this.descriptor.status !== 'AVAILABLE'
      ? ` | ${this.descriptor.status}`
      : '';
    return `${this.descriptor.label ?? task.taskType}${status}`;
  }
}

function normalizeType(type: string): string {
  return String(type || '').trim().toUpperCase();
}

function normalizeStatus(status: string | null | undefined): ProcessTaskProviderDescriptor['status'] {
  const normalized = String(status || 'AVAILABLE').trim().toUpperCase();
  return normalized === 'DEGRADED'
    || normalized === 'UNTRUSTED'
    || normalized === 'SHADOWED_BY_LOCAL'
    ? normalized
    : 'AVAILABLE';
}

function humanizeRemoteType(type: string): string {
  return type
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}
