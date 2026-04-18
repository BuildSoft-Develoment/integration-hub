import { computed, inject, Injectable } from '@angular/core';
import { I18nService } from './i18n.service';
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

  summarize(task: ProcessTaskFormModel, context: ProcessTaskSummaryContext): string {
    return this.resolve(task.taskType)?.summarize(task, context, this.i18n) ?? this.label(task.taskType);
  }
}
