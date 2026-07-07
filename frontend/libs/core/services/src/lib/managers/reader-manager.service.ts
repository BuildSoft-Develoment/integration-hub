import { computed, inject, Injectable, signal } from '@angular/core';
import { ResourcePresentation } from '@integration-hub/shared/models';
import {
  READER_PROVIDERS,
  ReaderDraft,
  ReaderProvider,
  ReaderProviderType,
} from '@integration-hub/core/providers';
import { READER_PRESENTATION } from '../presentation/resource-presentation.maps';

@Injectable({ providedIn: 'root' })
export class ReaderManagerService {
  private readonly providers = inject(READER_PROVIDERS, { optional: true }) ?? [];
  private readonly defaultType = this.providers[0]?.descriptor.type ?? 'TXT';

  readonly selectedType = signal<ReaderProviderType>(this.defaultType);

  readonly availableProviders = computed(() =>
    this.providers.map((provider) => provider.descriptor)
  );

  readonly activeProvider = computed(
    () =>
      this.providers.find((provider) => provider.supports(this.selectedType())) ??
      this.providers[0] ??
      null
  );

  select(type: ReaderProviderType): void {
    if (this.providers.some((provider) => provider.supports(type))) {
      this.selectedType.set(type);
    }
  }

  resolve(type: ReaderProviderType): ReaderProvider | null {
    return this.providers.find((provider) => provider.supports(type)) ?? null;
  }

  /**
   * Presentacion visual (icono + tono) del tipo de lector. Resolucion total
   * via {@link READER_PRESENTATION}: siempre devuelve una presentacion
   * concreta, sin fallback en runtime.
   */
  presentation(type: ReaderProviderType): ResourcePresentation {
    return READER_PRESENTATION[type];
  }

  createDraftFor(type: ReaderProviderType): ReaderDraft {
    return this.resolve(type)?.createDraft() ?? { type };
  }

  hydrateDraft(type: ReaderProviderType, configurationJson: string): ReaderDraft {
    return this.resolve(type)?.hydrateDraft(configurationJson) ?? this.createDraftFor(type);
  }

  serializeDraft(type: ReaderProviderType, draft: ReaderDraft): string {
    return this.resolve(type)?.toConfigurationJson(draft) ?? JSON.stringify(draft, null, 2);
  }
}
