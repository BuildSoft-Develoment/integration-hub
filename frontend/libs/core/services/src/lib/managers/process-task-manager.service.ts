import { computed, inject, Injectable } from '@angular/core';
import { ResourcePresentation } from '@integration-hub/shared/models';
import { I18nService } from '@integration-hub/core/i18n';
import {
  PROCESS_TASK_PROVIDERS,
  ProcessTaskFormModel,
  ProcessTaskProvider,
  ProcessTaskSummaryContext,
  ProcessTaskType,
} from '@integration-hub/core/providers';
import { TASK_PRESENTATION } from '../presentation/resource-presentation.maps';

@Injectable()
export class ProcessTaskManagerService {
  private readonly i18n = inject(I18nService);
  private readonly providers = inject(PROCESS_TASK_PROVIDERS, { optional: true }) ?? [];

  readonly availableProviders = computed(() => this.providers.map((provider) => provider.descriptor));

  /**
   * Presentacion visual (icono + tono) del tipo de tarea. Resolucion total
   * via {@link TASK_PRESENTATION}: siempre devuelve una presentacion
   * concreta, sin fallback en runtime.
   */
  presentation(type: ProcessTaskType): ResourcePresentation {
    return TASK_PRESENTATION[type];
  }

  resolve(type: ProcessTaskType): ProcessTaskProvider<any> | null {
    return this.providers.find((provider) => provider.supports(type)) ?? null;
  }

  label(type: ProcessTaskType): string {
    const provider = this.resolve(type);
    if (!provider) throw new Error(`No provider registered for task type: ${type}`);
    return this.i18n.t(provider.descriptor.labelKey);
  }

  modalLayout(type: ProcessTaskType): 'workspace' | 'rest' | undefined {
    const provider = this.resolve(type);
    if (!provider) throw new Error(`No provider registered for task type: ${type}`);
    return provider.descriptor.modalLayout;
  }

  hydrateDraft<TDraft>(task: ProcessTaskFormModel): TDraft | null {
    return (this.resolve(task.taskType)?.hydrateDraft(task) as TDraft | undefined) ?? null;
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
    if (!provider) throw new Error(`No provider registered for task type: ${task.taskType}`);
    return provider.summarize(task, context, this.i18n);
  }
}
