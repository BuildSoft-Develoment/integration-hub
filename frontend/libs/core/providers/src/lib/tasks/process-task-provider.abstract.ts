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
  label?: string;
  /**
   * ADR-021: agrupacion del tipo en la paleta, DECLARADA por el provider (no inferida por el
   * motor). Un vertical usa su propio identificador (`swift-mt101`, `sbs`, ...) y aporta la
   * etiqueta como clave i18n `processTask.category.<category>`. Sin declarar, el motor agrupa
   * sus propios tipos en `motor` y el resto en `plugin`.
   */
  category?: string;
  origin?: 'BUILTIN' | 'LOCAL' | 'REMOTE';
  pluginId?: string | null;
  pluginVersion?: string | null;
  status?: 'AVAILABLE' | 'DEGRADED' | 'UNTRUSTED' | 'SHADOWED_BY_LOCAL';
  reason?: string | null;
  transport?: string | null;
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

  /**
   * Copia verbatim las {@code keys} presentes en el config (ausente sigue ausente), para transportarlas en el
   * draft y re-emitirlas en {@code toTaskPatch}.
   *
   * <p>Existe porque {@code toTaskPatch} reconstruye el {@code configurationJson} desde cero: toda clave que el
   * backend lee y el draft no carga se BORRA al guardar. No se les inventa un default a proposito — varias son
   * tri-estado o listas cuyo "ausente" tiene semantica propia en el backend, y asignarles un valor al
   * serializar cambiaria el comportamiento. Cuando un formulario pase a gobernar una clave, se la saca de su
   * lista y se la tipa en el draft.</p>
   */
  protected preserveKeys(config: Record<string, any>, keys: readonly string[]): Record<string, unknown> {
    const preserved: Record<string, unknown> = {};
    keys.forEach((key) => {
      if (config[key] !== undefined) {
        preserved[key] = config[key];
      }
    });
    return preserved;
  }

  /**
   * Complemento de {@code preserveKeys}: devuelve TODAS las claves de {@code config} MENOS las que el
   * formulario pasa a gobernar. Se usa cuando un OBJETO anidado (p.ej. {@code source}) tiene unos pocos campos
   * expuestos por el form y un resto de scope/tuning que debe viajar verbatim.
   */
  protected omitKeys(config: Record<string, any>, keys: readonly string[]): Record<string, unknown> {
    const rest: Record<string, unknown> = {};
    Object.keys(config || {}).forEach((key) => {
      if (!keys.includes(key)) {
        rest[key] = config[key];
      }
    });
    return rest;
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
        // El motor lee estos dos y NINGUN formulario los edita. Sin re-emitirlos, cualquier guardado los
        // borraba: perder `filters` elimina el WHERE y la tarea pasa a consumir la TABLA ENTERA en vez del
        // subconjunto acotado; perder `cursor.orderBy` rompe la paginacion keyset (obligatoria por tabla).
        ...(input.cursor ? { cursor: input.cursor } : {}),
        ...(input.filters ? { filters: input.filters } : {}),
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
      // cursor/filters: ningun formulario los edita, pero el motor SI los lee (TaskInputResolver). Se
      // transportan tal cual para que guardar no los borre — ver withRuntime.
      ...(this.isPlainObject(raw['cursor']) ? { cursor: raw['cursor'] as { orderBy?: string } } : {}),
      ...(this.isPlainObject(raw['filters']) ? { filters: raw['filters'] as Record<string, unknown> } : {}),
    };
  }

  private isPlainObject(value: unknown): boolean {
    return !!value && typeof value === 'object' && !Array.isArray(value);
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
