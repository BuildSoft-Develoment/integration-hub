// @trace spec 008-mensajeria-pagos RF-007, T-017
// @trace ADR-009
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/i18n';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../../../tasks/process-task-provider.abstract';
import { ProcessTaskRuntimeDraft } from '../../../../tasks/process-task-binding.models';
import { ProcessTaskFormModel } from '../../../../tasks/process-task.models';

/** Regla individual del clasificador. */
export interface Mt101RouteRuleDraft {
  name: string;
  predicate: string;
  routeTo: string;
}

/** Draft del formulario MT101_ROUTE. */
export interface Mt101RouteTaskDraft extends ProcessTaskRuntimeDraft {
  rules: Mt101RouteRuleDraft[];
  defaultRoute: string;
  routeField: string;
  /** Tuning que el backend lee y el form no expone. */
  preserved: Record<string, unknown>;
}

/**
 * {@code pageSize} lo lee el backend en las dos ramas ({@code Mt101RouteTaskProvider:168,215}) para acotar la
 * memoria del streaming. Sin transportarlo volvia a su default en cada guardado.
 */
const ROUTE_PRESERVED_KEYS = ['pageSize'] as const;

/**
 * Provider del task type {@code MT101_ROUTE}: clasifica records segun reglas
 * declarativas (predicados JEXL) y agrega un campo de ruta a cada record.
 */
@Injectable()
export class Mt101RouteTaskProvider extends ProcessTaskProvider<Mt101RouteTaskDraft> {
  readonly descriptor = {
    type: 'MT101_ROUTE' as const,
    labelKey: 'processTask.MT101_ROUTE',
    descriptionKey: 'processTaskDescription.MT101_ROUTE',
    category: 'swift-mt101',
    modalLayout: 'workspace' as const,
  };

  createDraft(): Mt101RouteTaskDraft {
    return {
      taskRef: '',
      executionMode: 'once',
      rules: [
        { name: 'internal-book-transfer', predicate: '', routeTo: 'BOOK_TRANSFER' },
      ],
      defaultRoute: 'UNROUTED',
      routeField: 'routedAs',
      preserved: {},
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): Mt101RouteTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'once');
    const rawRules = Array.isArray(config['rules']) ? config['rules'] : [];
    return {
      ...runtime,
      rules: rawRules
        .filter((r) => r && typeof r === 'object')
        .map((r) => ({
          name: String(r['name'] || ''),
          predicate: String(r['predicate'] || ''),
          routeTo: String(r['routeTo'] || ''),
        })),
      defaultRoute: String(config['defaultRoute'] || 'UNROUTED'),
      routeField: String(config['routeField'] || 'routedAs'),
      preserved: this.preserveKeys(config, ROUTE_PRESERVED_KEYS),
    };
  }

  toTaskPatch(draft: Mt101RouteTaskDraft): Partial<ProcessTaskFormModel> {
    const payload: Record<string, unknown> = this.withRuntime(
      {
        ...draft.preserved,
        // Se persisten TODAS las reglas tal cual (incluidas las incompletas en edicion), igual que las filas
        // repetibles de MT101_REPAIR / FILE_WRITE. Filtrar las incompletas aca rompia el "Agregar regla": el
        // draft se recomputa desde el task persistido, asi que una regla recien agregada (vacia) se descartaba
        // en el round-trip y desaparecia (ni siquiera se podia tipear). El backend valida/ignora las
        // incompletas en ejecucion.
        rules: draft.rules.map((r) => ({ name: r.name, predicate: r.predicate, routeTo: r.routeTo })),
        defaultRoute: draft.defaultRoute,
        routeField: draft.routeField,
      },
      draft,
      'once',
    );
    return { configurationJson: this.toPrettyJson(payload) };
  }

  override summarize(task: ProcessTaskFormModel, _ctx: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    return [i18n.t(this.descriptor.labelKey), `${config.rules.length} rule(s) -> default=${config.defaultRoute}`]
      .join(' | ');
  }
}
