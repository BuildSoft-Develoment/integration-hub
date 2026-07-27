import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { ProcessFlowNodePresentation, ResourcePresentation } from '@integration-hub/shared/models';
import { I18nService } from '@integration-hub/core/i18n';
import {
  PROCESS_TASK_PROVIDERS,
  ProcessTaskFormModel,
  ProcessTaskProvider,
  ProcessTaskSummaryContext,
  PlatformProcessTaskType,
  ProcessTaskType,
  SchemaTaskProvider,
  TaskCatalogItem,
} from '@integration-hub/core/providers';
import { firstValueFrom } from 'rxjs';
import { TASK_PRESENTATION } from '../presentation/resource-presentation.maps';

interface TaskTypeCatalogResponse {
  readonly taskTypes: TaskCatalogItem[];
}

const SCHEMA_TASK_PRESENTATION: ResourcePresentation = {
  icon: 'cpu',
  toneClass: 'ih-tone-integration',
};

@Injectable()
export class ProcessTaskManagerService {
  private readonly i18n = inject(I18nService);
  private readonly http = inject(HttpClient, { optional: true });
  private readonly providers = inject(PROCESS_TASK_PROVIDERS, { optional: true }) ?? [];
  private readonly remoteProviders = signal<ProcessTaskProvider<unknown>[]>([]);
  readonly remoteCatalogLoading = signal(false);
  readonly remoteCatalogError = signal<string | null>(null);

  private readonly allProviders = computed(() => [
    ...this.providers,
    ...this.remoteProviders(),
  ]);

  readonly availableProviders = computed(() => this.allProviders().map((provider) => provider.descriptor));

  async loadRemoteTaskTypes(): Promise<void> {
    if (!this.http) {
      return;
    }
    this.remoteCatalogLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<TaskTypeCatalogResponse>('/api/task-types')
      );
      const compiledTypes = new Set(
        this.providers.map((provider) => normalizeType(provider.descriptor.type))
      );
      // ADR-021: se hidrata TODO tipo del catalogo que no tenga formulario compilado, no solo los
      // REMOTE. Un vertical LOCAL (SBS u otro estandar) entra por el mismo camino que un plugin:
      // le alcanza con declarar configSchema() en su TaskProvider. Los tipos con formulario
      // compilado (los 12 MT101, los builtin) quedan excluidos y siguen resolviendo al suyo.
      // Se exige `configurable` a los no-REMOTE: sin config-schema no hay forma de configurarlos,
      // y ofrecer una tarea que no se puede completar es peor que no ofrecerla.
      const schemaProviders = (response.taskTypes ?? [])
        .filter((item) => item.type?.trim())
        .filter((item) => !compiledTypes.has(normalizeType(item.type)))
        .filter((item) => normalizeType(item.origin) === 'REMOTE' || item.configurable === true)
        .map((item) => new SchemaTaskProvider(item));
      this.remoteProviders.set(schemaProviders);
      this.remoteCatalogError.set(null);
    } catch (error) {
      this.remoteCatalogError.set('processTask.remoteCatalogError');
      this.remoteProviders.set([]);
    } finally {
      this.remoteCatalogLoading.set(false);
    }
  }

  /**
   * Presentacion visual (icono + tono) del tipo de tarea. ADR-021: gana la que DECLARA el
   * provider, luego el default de los tipos propios del motor, y por ultimo la generica. Siempre
   * devuelve una presentacion concreta.
   */
  presentation(type: ProcessTaskType): ResourcePresentation {
    const declared = this.resolve(type)?.descriptor.presentation;
    if (declared) {
      return declared;
    }
    return TASK_PRESENTATION[type as PlatformProcessTaskType] ?? SCHEMA_TASK_PRESENTATION;
  }

  /**
   * ADR-021: visual del nodo de flujo DECLARADA por el provider, si la declara. El editor de
   * procesos la combina con su propio mapa de defaults (vive en la feature, no en el core).
   */
  declaredNodePresentation(type: ProcessTaskType): ProcessFlowNodePresentation | undefined {
    return this.resolve(type)?.descriptor.nodePresentation;
  }

  resolve(type: ProcessTaskType): ProcessTaskProvider<any> | null {
    return this.allProviders().find((provider) => provider.supports(type)) ?? null;
  }

  label(type: ProcessTaskType): string {
    const provider = this.resolve(type);
    // Tolera tipos sin provider (removidos como MT101_BUILD, o plugins remotos no
    // disponibles): en vez de romper el render de la lista de tareas, muestra el
    // tipo crudo. La creacion de tareas sigue restringida a tipos registrados.
    if (!provider) return type;
    // ADR-021: gana la clave i18n cuando existe (i18n.t devuelve la propia clave si falta), y si no
    // el label del descriptor. Asi un vertical puede rotular sus tipos con registerMessages() aunque
    // el provider haya sido creado desde el catalogo (que solo sabe humanizar el type).
    const key = provider.descriptor.labelKey;
    const translated = this.i18n.t(key);
    if (translated !== key) {
      return translated;
    }
    return provider.descriptor.label ?? key;
  }

  status(type: ProcessTaskType): ProcessTaskProvider<unknown>['descriptor']['status'] {
    return this.resolve(type)?.descriptor.status ?? 'AVAILABLE';
  }

  statusReason(type: ProcessTaskType): string | null {
    return this.resolve(type)?.descriptor.reason ?? null;
  }

  isAvailable(type: ProcessTaskType): boolean {
    return this.status(type) === 'AVAILABLE';
  }

  modalLayout(type: ProcessTaskType): 'workspace' | 'rest' | undefined {
    // Sin provider (tipo removido / plugin no disponible): no rompas; sin layout.
    return this.resolve(type)?.descriptor.modalLayout;
  }

  /**
   * Draft hidratado de una tarea existente, resuelto por su provider registrado. Politica no-fallback (SOLID):
   * si el task type no tiene provider, LANZA (igual que {@link defaultConfigurationJson}) — un form dedicado
   * siempre corresponde a un task type registrado, asi que un provider ausente aqui seria un bug de registro,
   * no un estado normal a enmascarar con un draft por defecto. Es la fuente unica del draft inicial del form:
   * reemplaza el par hydrateDraft()+fallback local (defaultDraft() en los MT101, literal inline en el resto),
   * que duplicaba createDraft() y habia derivado en silencio al ser codigo muerto (la rama ?? nunca corria).
   */
  draftFor<TDraft>(task: ProcessTaskFormModel): TDraft {
    const provider = this.resolve(task.taskType);
    if (!provider) {
      throw new Error(`No provider registered for task type: ${task.taskType}`);
    }
    return provider.hydrateDraft(task) as TDraft;
  }

  toTaskPatch<TDraft>(type: ProcessTaskType, draft: TDraft): Partial<ProcessTaskFormModel> {
    return this.resolve(type)?.toTaskPatch(draft) ?? {};
  }

  /**
   * Devuelve el {@code configurationJson} default para un task type recien
   * creado, consultando el provider registrado. Si no hay provider, lanza
   * error (politica no-fallback: todo task type debe tener un provider).
   */
  defaultConfigurationJson(type: ProcessTaskType, taskRef: string): string {
    const provider = this.resolve(type);
    if (!provider) throw new Error(`No provider registered for task type: ${type}`);
    const draft = provider.createDraft() as Record<string, unknown>;
    // Sobre-escribe el taskRef del draft con el clientId real de la tarea.
    if (draft && typeof draft === 'object') {
      (draft as { taskRef?: string }).taskRef = taskRef;
    }
    const patch = provider.toTaskPatch(draft);
    if (typeof patch.configurationJson !== 'string') throw new Error(`Provider for ${type} did not produce a string configurationJson`);
    return patch.configurationJson;
  }

  summarize(task: ProcessTaskFormModel, context: ProcessTaskSummaryContext): string {
    const provider = this.resolve(task.taskType);
    // Sin provider: no rompas la lista; el chip igual muestra el tipo crudo (label).
    if (!provider) return '';
    return provider.summarize(task, context, this.i18n);
  }
}

function normalizeType(value: unknown): string {
  return String(value || '').trim().toUpperCase();
}
