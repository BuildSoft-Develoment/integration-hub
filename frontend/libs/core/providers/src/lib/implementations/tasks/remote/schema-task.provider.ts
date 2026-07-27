import { I18nService } from '@integration-hub/core/i18n';
import {
  ProcessTaskProvider,
  ProcessTaskProviderDescriptor,
  ProcessTaskSummaryContext,
} from '../../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../../tasks/process-task.models';

export interface TaskCatalogItem {
  readonly type: string;
  readonly origin?: string;
  readonly provider?: string;
  readonly pluginId?: string | null;
  readonly pluginVersion?: string | null;
  readonly transport?: string | null;
  readonly status?: string | null;
  readonly reason?: string | null;
  /** ADR-021: el provider declara config-schema no vacio -> se puede configurar sin form compilado. */
  readonly configurable?: boolean;
}

interface RemoteTaskDraft {
  readonly taskRef?: string;
  readonly executionMode?: 'once';
}

/**
 * Adaptador frontend para task types que NO traen formulario compilado en el build Angular.
 *
 * No trae un formulario hardcoded: `ProcessTaskFormHostComponent` consulta el
 * config-schema del backend y renderiza `ih-schema-form`. Este provider solo hace
 * visible la capacidad en la paleta/editor y produce una configuracion inicial minima.
 *
 * ADR-021: sirve tanto a plugins REMOTE (instalados fuera del build) como a verticales
 * LOCAL compilados en el backend — el `origin` viaja desde el catalogo, no se asume. Es lo
 * que permite dar de alta un vertical nuevo (SBS, otro estandar) sin editar libs del core:
 * le alcanza con declarar su `configSchema()` en el `TaskProvider`.
 */
export class SchemaTaskProvider extends ProcessTaskProvider<RemoteTaskDraft> {
  readonly descriptor: ProcessTaskProviderDescriptor;

  constructor(item: TaskCatalogItem) {
    super();
    const type = normalizeType(item.type);
    const origin = normalizeType(item.origin ?? '') === 'REMOTE' ? 'REMOTE' : 'LOCAL';
    // Namespace de i18n por origen: un vertical local aporta sus claves con
    // I18nService.registerMessages() bajo processTask.<TYPE>, igual que los tipos compilados.
    const i18nBase = origin === 'REMOTE' ? `processTask.remote.${type}` : `processTask.${type}`;
    this.descriptor = {
      type,
      labelKey: i18nBase,
      descriptionKey: `${i18nBase}.description`,
      label: humanizeType(type),
      modalLayout: 'workspace',
      origin,
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

function humanizeType(type: string): string {
  return type
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}
