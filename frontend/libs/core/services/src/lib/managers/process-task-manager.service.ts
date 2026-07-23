import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { ResourcePresentation } from '@integration-hub/shared/models';
import { I18nService } from '@integration-hub/core/i18n';
import {
  PROCESS_TASK_PROVIDERS,
  ProcessTaskFormModel,
  ProcessTaskProvider,
  ProcessTaskSummaryContext,
  PlatformProcessTaskType,
  ProcessTaskType,
  RemoteSchemaTaskProvider,
  RemoteTaskCatalogItem,
} from '@integration-hub/core/providers';
import { firstValueFrom } from 'rxjs';
import { TASK_PRESENTATION } from '../presentation/resource-presentation.maps';

interface TaskTypeCatalogResponse {
  readonly taskTypes: RemoteTaskCatalogItem[];
}

const REMOTE_TASK_PRESENTATION: ResourcePresentation = {
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
      const localTypes = new Set(
        this.providers.map((provider) => normalizeType(provider.descriptor.type))
      );
      const remoteProviders = (response.taskTypes ?? [])
        .filter((item) => normalizeType(item.origin) === 'REMOTE')
        .filter((item) => item.type?.trim())
        .filter((item) => !localTypes.has(normalizeType(item.type)))
        .map((item) => new RemoteSchemaTaskProvider(item));
      this.remoteProviders.set(remoteProviders);
      this.remoteCatalogError.set(null);
    } catch (error) {
      this.remoteCatalogError.set('processTask.remoteCatalogError');
      this.remoteProviders.set([]);
    } finally {
      this.remoteCatalogLoading.set(false);
    }
  }

  /**
   * Presentacion visual (icono + tono) del tipo de tarea. Resolucion total
   * via {@link TASK_PRESENTATION}: siempre devuelve una presentacion
   * concreta, sin fallback en runtime.
   */
  presentation(type: ProcessTaskType): ResourcePresentation {
    return isPlatformTaskType(type)
      ? TASK_PRESENTATION[type]
      : REMOTE_TASK_PRESENTATION;
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
    return provider.descriptor.label ?? this.i18n.t(provider.descriptor.labelKey);
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

  hydrateDraft<TDraft>(task: ProcessTaskFormModel): TDraft | null {
    return (this.resolve(task.taskType)?.hydrateDraft(task) as TDraft | undefined) ?? null;
  }

  /**
   * Draft hidratado de una tarea existente, resuelto por su provider registrado. Politica no-fallback (SOLID):
   * si el task type no tiene provider, LANZA (igual que {@link defaultConfigurationJson}) — un form dedicado
   * siempre corresponde a un task type registrado, asi que un provider ausente aqui seria un bug de registro,
   * no un estado normal a enmascarar con un draft por defecto. Es la fuente unica del draft inicial del form:
   * reemplaza los defaultDraft() locales, que duplicaban createDraft() (y habian derivado en silencio).
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

function isPlatformTaskType(type: ProcessTaskType): type is PlatformProcessTaskType {
  return Object.prototype.hasOwnProperty.call(TASK_PRESENTATION, type);
}
