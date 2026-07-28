// @trace spec 008-mensajeria-pagos RF-006, T-014
// @trace ADR-009
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/i18n';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '@integration-hub/core/providers';
import { ProcessTaskRuntimeDraft } from '@integration-hub/core/providers';
import { ProcessTaskFormModel } from '@integration-hub/core/providers';

/** Draft del formulario MT101_RECONCILE. */
export interface Mt101ReconcileTaskDraft extends ProcessTaskRuntimeDraft {
  connectionRef: string;
  sentTable: string;
  confirmationTable: string;
  matchKeys: string;
  asOfDate: string;
  lookbackDays: number;
  exceptionConnectionRef: string;
  exceptionTable: string;
  /**
   * Valor crudo de publishExceptionsTo cuando el hydrate NO supo parsearlo. {@code parseExceptionTable} del
   * backend acepta tambien {@code "table:tabla"} (sin conexion) y el nombre suelto; el form solo lee
   * {@code "table:conn:tabla"}. Viaja verbatim.
   */
  publishExceptionsToRaw: unknown;
  /** Claves que el backend lee y el form no gobierna; viajan verbatim. */
  preserved: Record<string, unknown>;
}

/**
 * archiveStatusSync lo lee Mt101ReconcileTaskProvider:143 con boolValue(x, TRUE): ausente == true. Perderlo
 * REACTIVA la escritura de vuelta a la tabla de archivo que el operador apago — misma clave y mismo modo de
 * fallo ya corregidos en MT101_PAY.
 */
const RECONCILE_PRESERVED_KEYS = ['archiveStatusSync'] as const;

/**
 * Tabla por defecto del sink de excepciones. El backend ({@code parseExceptionTable}) cae a ella cuando la
 * clave esta ausente, asi que una tarea nueva arranca con ella + el Data Source de la plataforma (conexion
 * vacia), igual que DB_WRITE con {@code staging_record}. Vaciarla NO apaga el sink (el backend igual escribe
 * en la default): documenta el destino real en el form. La conexion es lo variable.
 */
const DEFAULT_EXCEPTION_TABLE = 'mt101_reconciliation_exception';

/**
 * Provider del task type {@code MT101_RECONCILE}.
 */
@Injectable()
export class Mt101ReconcileTaskProvider extends ProcessTaskProvider<Mt101ReconcileTaskDraft> {
  readonly descriptor = {
    type: 'MT101_RECONCILE' as const,
    summaryFields: ['matchedCount', 'unmatchedCount', 'mismatchCount'],
    labelKey: 'processTask.MT101_RECONCILE',
    descriptionKey: 'processTaskDescription.MT101_RECONCILE',
    category: 'swift-mt101',
    availableOutputs: ['metadata', 'summary', 'records', 'errors'] as const,
    defaultOutput: 'records' as const,
    recordFields: ['sendersReference', 'status', 'matchedReference', 'mismatchReason'] as const,
    modalLayout: 'workspace' as const,
  };

  createDraft(): Mt101ReconcileTaskDraft {
    return {
      taskRef: '',
      executionMode: 'once',
      connectionRef: '',
      sentTable: 'mt101_archive',
      confirmationTable: 'mt101_confirmation',
      matchKeys: 'senders_reference',
      asOfDate: '${today}',
      lookbackDays: 5,
      exceptionConnectionRef: '',
      // Arranca con la tabla por defecto + Data Source de la plataforma (conexion vacia), como DB_WRITE con
      // staging_record: hace visible en el form el destino real de las excepciones (el backend cae ahi igual).
      exceptionTable: DEFAULT_EXCEPTION_TABLE,
      publishExceptionsToRaw: undefined,
      preserved: {},
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): Mt101ReconcileTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'once');
    const matchKeys = Array.isArray(config['matchKeys'])
      ? config['matchKeys'].join(',')
      : String(config['matchKeys'] || 'senders_reference');
    const rawExc = config['publishExceptionsTo'];
    const rawPresent = rawExc !== undefined && String(rawExc).trim().length > 0;
    const exceptionRef = this.parsePublishExceptionsTo(String(rawExc || ''));
    return {
      ...runtime,
      connectionRef: String(config['connectionRef'] || ''),
      sentTable: String(config['sentTable'] || 'mt101_archive'),
      confirmationTable: String(config['confirmationTable'] || 'mt101_confirmation'),
      matchKeys,
      asOfDate: String(config['asOfDate'] || '${today}'),
      lookbackDays: Number(config['lookbackDays']) || 5,
      exceptionConnectionRef: exceptionRef.connRef,
      // El default se aplica SOLO cuando publishExceptionsTo esta AUSENTE. Si vino pero no se pudo parsear
      // (mapa / nombre suelto), la tabla queda vacia para que el crudo preservado gobierne el emit.
      exceptionTable: exceptionRef.table || (rawPresent ? '' : DEFAULT_EXCEPTION_TABLE),
      // El crudo se guarda SOLO si vino y el parseo fallo. Si parseo, manda el form.
      publishExceptionsToRaw: exceptionRef.table ? undefined : (rawPresent ? rawExc : undefined),
      preserved: this.preserveKeys(config, RECONCILE_PRESERVED_KEYS),
    };
  }

  toTaskPatch(draft: Mt101ReconcileTaskDraft): Partial<ProcessTaskFormModel> {
    const matchKeysArray = draft.matchKeys
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    // La conexion es OPCIONAL (parseExceptionTable ni la mira). Exigirla para emitir borraba la tabla de
    // excepciones configurada de toda config sin conexion explicita.
    const publishExceptionsTo = draft.exceptionTable
      ? (draft.exceptionConnectionRef
          ? `table:${draft.exceptionConnectionRef}:${draft.exceptionTable}`
          : `table:${draft.exceptionTable}`)
      : undefined;
    const payload: Record<string, unknown> = this.withRuntime(
      {
        ...draft.preserved,
        connectionRef: draft.connectionRef || undefined,
        sentTable: draft.sentTable,
        confirmationTable: draft.confirmationTable,
        matchKeys: matchKeysArray,
        asOfDate: draft.asOfDate,
        lookbackDays: draft.lookbackDays,
        // Perderlo NO apaga el sink: parseExceptionTable cae a mt101_reconciliation_exception, asi que las
        // excepciones de conciliacion se irian a una tabla DISTINTA de la configurada, sin aviso.
        ...(publishExceptionsTo !== undefined
          ? { publishExceptionsTo }
          : draft.publishExceptionsToRaw !== undefined
            ? { publishExceptionsTo: draft.publishExceptionsToRaw }
            : {}),
      },
      draft,
      'once',
    );
    return { configurationJson: this.toPrettyJson(payload) };
  }

  override summarize(task: ProcessTaskFormModel, _ctx: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    return [
      i18n.t(this.descriptor.labelKey),
      `${config.sentTable} vs ${config.confirmationTable} lookback=${config.lookbackDays}d`,
    ].join(' | ');
  }

  /**
   * Espeja {@code parseExceptionTable} del backend: {@code parts.length >= 2 ? parts[1] : parts[0]}. Leer
   * siempre parts[1] como tabla dejaba {@code "table:mi_tabla"} con connRef=mi_tabla y tabla vacia -> el
   * default rellenaba la tabla y se guardaba {@code "table:mi_tabla:mt101_reconciliation_exception"}: las
   * excepciones pasaban a escribirse en la tabla por defecto, no en la configurada.
   */
  private parsePublishExceptionsTo(value: string): { connRef: string; table: string } {
    if (!value.startsWith('table:')) {
      return { connRef: '', table: '' };
    }
    const parts = value.substring('table:'.length).split(':');
    return parts.length >= 2
      ? { connRef: parts[0] || '', table: parts[1] || '' }
      : { connRef: '', table: parts[0] || '' };
  }
}
