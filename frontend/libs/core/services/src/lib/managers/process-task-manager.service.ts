import { computed, inject, Injectable } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import {
  PROCESS_TASK_PROVIDERS,
  ProcessTaskFormModel,
  ProcessTaskProvider,
  ProcessTaskSummaryContext,
  ProcessTaskType,
} from '@integration-hub/core/providers';

@Injectable()
export class ProcessTaskManagerService {
  private readonly i18n = inject(I18nService);
  private readonly providers = inject(PROCESS_TASK_PROVIDERS, { optional: true }) ?? [];

  readonly availableProviders = computed(() => this.providers.map((provider) => provider.descriptor));

  resolve(type: ProcessTaskType): ProcessTaskProvider<any> | null {
    return this.providers.find((provider) => provider.supports(type)) ?? null;
  }

  label(type: ProcessTaskType): string {
    return this.resolve(type) ? this.i18n.t(this.resolve(type)!.descriptor.labelKey) : type;
  }

  modalLayout(type: ProcessTaskType): 'workspace' | 'rest' | 'default' {
    return this.resolve(type)?.descriptor.modalLayout ?? 'default';
  }

  hydrateDraft<TDraft>(task: ProcessTaskFormModel): TDraft | null {
    return (this.resolve(task.taskType)?.hydrateDraft(task) as TDraft | undefined) ?? null;
  }

  toTaskPatch<TDraft>(type: ProcessTaskType, draft: TDraft): Partial<ProcessTaskFormModel> {
    return this.resolve(type)?.toTaskPatch(draft) ?? {};
  }

  /**
   * Devuelve el {@code configurationJson} default para un task type recien
   * creado, consultando el provider registrado (sin importar si es del motor o
   * de una vertical). Si no hay provider, retorna {@code undefined} y el caller
   * cae al placeholder hardcoded de {@code defaultTaskConfig}.
   *
   * <p>Cierra el gap M-1a a nivel UX: ahora cuando el usuario agrega un
   * {@code MT101_BUILD} desde el palette, el config inicial respeta los
   * defaults del {@code Mt101BuildTaskProvider} (format=JSON, envelope
   * vacio, sequenceA con sendersReferenceTemplate, etc.).</p>
   */
  defaultConfigurationJson(type: ProcessTaskType, taskRef: string): string | undefined {
    const provider = this.resolve(type);
    if (!provider) {
      return undefined;
    }
    const draft = provider.createDraft() as Record<string, unknown>;
    // Sobre-escribe el taskRef del draft con el clientId real de la tarea.
    if (draft && typeof draft === 'object') {
      (draft as { taskRef?: string }).taskRef = taskRef;
    }
    const patch = provider.toTaskPatch(draft);
    return typeof patch.configurationJson === 'string' ? patch.configurationJson : undefined;
  }

  summarize(task: ProcessTaskFormModel, context: ProcessTaskSummaryContext): string {
    return this.resolve(task.taskType)?.summarize(task, context, this.i18n) ?? this.label(task.taskType);
  }
}
