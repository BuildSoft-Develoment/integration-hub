// @trace spec 008-mensajeria-pagos RF-002, T-007
// @trace ADR-009
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/i18n';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '@integration-hub/core/providers';
import { ProcessTaskRuntimeDraft } from '@integration-hub/core/providers';
import { ProcessTaskFormModel } from '@integration-hub/core/providers';

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
  /**
   * Valor crudo de publishIssuesTo cuando el hydrate NO supo parsearlo. Viaja VERBATIM (unknown, no String):
   * el backend acepta tambien un mapa {@code {table, connectionRef}}, y stringificarlo escribiria
   * "[object Object]" — que {@code IssueSink.enabled} rechaza con IllegalArgumentException en ejecucion.
   */
  publishIssuesToRaw: unknown;
  /** Claves de tuning que el backend lee y el form no expone. */
  preserved: Record<string, unknown>;
}

/**
 * Tuning que el backend lee y el form no expone: cap de la muestra de incidencias en el output y tamano de
 * pagina del streaming. Sin transportarlos volvian a sus defaults en cada guardado.
 */
const VALIDATE_PRESERVED_KEYS = ['maxIssuesInOutput', 'pageSize'] as const;

/**
 * Tabla por defecto del sink de incidencias. El backend ({@code IssueSink.enabled}) SOLO acepta esta tabla:
 * lanza {@code IllegalArgumentException} con cualquier otra. Por eso es efectivamente fija y una tarea nueva
 * arranca con ella + el Data Source de la plataforma (conexion vacia), igual que DB_WRITE arranca con
 * {@code staging_record}. Vaciarla sigue APAGANDO el sink (la tabla es el interruptor).
 */
const DEFAULT_ISSUE_TABLE = 'mt101_validation_issue';

/**
 * Provider del task type {@code MT101_VALIDATE}: convierte entre el draft del
 * formulario y el {@code configuration_json}.
 */
@Injectable()
export class Mt101ValidateTaskProvider extends ProcessTaskProvider<Mt101ValidateTaskDraft> {
  readonly descriptor = {
    type: 'MT101_VALIDATE' as const,
    summaryFields: ['validCount', 'invalidCount', 'issueCount'],
    labelKey: 'processTask.MT101_VALIDATE',
    descriptionKey: 'processTaskDescription.MT101_VALIDATE',
    category: 'swift-mt101',
    availableOutputs: ['metadata', 'summary', 'fragments', 'errors'] as const,
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
      // Arranca con la tabla por defecto + Data Source de la plataforma (conexion vacia), como DB_WRITE con
      // staging_record: validar un camino de dinero deberia registrar sus incidencias por defecto. Para
      // apagar el sink, vaciar la tabla.
      publishIssuesTable: DEFAULT_ISSUE_TABLE,
      publishIssuesToRaw: undefined,
      preserved: {},
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): Mt101ValidateTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'once');
    const rawIssues = config['publishIssuesTo'];
    const rawPresent = rawIssues !== undefined && String(rawIssues).trim().length > 0;
    const { connRef, table } = this.parsePublishIssuesTo(String(rawIssues || ''));
    return {
      ...runtime,
      executionMode: 'once',
      ruleSet: String(config['ruleSet'] || 'structural-mvp'),
      standard: this.normalizeStandard(config['standard']),
      appliesTo: String(config['appliesTo'] || 'MT101'),
      businessCalendar: String(config['businessCalendar'] || 'PE'),
      failOn: this.normalizeFailOn(config['failOn']),
      publishIssuesConnectionRef: connRef,
      // El default (tabla fija) se aplica SOLO cuando publishIssuesTo esta AUSENTE. Si vino pero no se pudo
      // parsear (mapa / nombre suelto), la tabla queda vacia para que el crudo preservado gobierne el emit y no
      // lo pise el default.
      publishIssuesTable: table || (rawPresent ? '' : DEFAULT_ISSUE_TABLE),
      // El crudo se guarda SOLO si vino y el parseo fallo. Si parseo, manda el form (y se puede vaciar).
      publishIssuesToRaw: table ? undefined : (rawPresent ? rawIssues : undefined),
      preserved: this.preserveKeys(config, VALIDATE_PRESERVED_KEYS),
    };
  }

  toTaskPatch(draft: Mt101ValidateTaskDraft): Partial<ProcessTaskFormModel> {
    // La conexion es OPCIONAL (IssueSink.from la deja en null con una sola parte). Exigirla para emitir
    // borraba el sink de toda config sin conexion explicita — incluida la de los ITs.
    const publishIssuesTo = draft.publishIssuesTable
      ? (draft.publishIssuesConnectionRef
          ? `table:${draft.publishIssuesConnectionRef}:${draft.publishIssuesTable}`
          : `table:${draft.publishIssuesTable}`)
      : undefined;
    const payload: Record<string, unknown> = this.withRuntime(
      {
        ...draft.preserved,
        rules: ['__catalog__'],
        ruleSet: draft.ruleSet,
        standard: draft.standard,
        appliesTo: draft.appliesTo,
        businessCalendar: draft.businessCalendar,
        failOn: draft.failOn,
        // IssueSink.from acepta cuatro formas (mapa, "table:tabla", "table:conn:tabla", nombre suelto) y el form
        // solo sabe leer la tercera. Sin esto, las otras se BORRABAN al guardar — y ausente == disabled(), o sea
        // que las incidencias dejaban de persistirse en silencio: se perdia el rastro de por que se rechazo un
        // pago. Si el form SI pudo parsear, manda el form (y vaciar la tabla apaga el sink de verdad).
        ...(publishIssuesTo !== undefined
          ? { publishIssuesTo }
          : draft.publishIssuesToRaw !== undefined
            ? { publishIssuesTo: draft.publishIssuesToRaw }
            : {}),
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

  /**
   * Espeja {@code IssueSink.from} del backend: con dos partes es {@code conn:tabla}; con una, la parte UNICA es
   * la TABLA y no hay conexion. Leer siempre parts[1] como tabla dejaba {@code "table:mt101_validation_issue"}
   * (la forma que usan los propios ITs) con connRef=nombre-de-tabla y tabla vacia -> el default rellenaba la
   * tabla y se guardaba {@code "table:mt101_validation_issue:mt101_validation_issue"}: el nombre de la tabla
   * terminaba en el slot de la CONEXION, que en ejecucion no resuelve.
   */
  private parsePublishIssuesTo(value: string): { connRef: string; table: string } {
    if (!value.startsWith('table:')) {
      return { connRef: '', table: '' };
    }
    const parts = value.substring('table:'.length).split(':');
    return parts.length >= 2
      ? { connRef: parts[0] || '', table: parts[1] || '' }
      : { connRef: '', table: parts[0] || '' };
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
