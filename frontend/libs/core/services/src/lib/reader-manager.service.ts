import { computed, inject, Injectable, signal } from '@angular/core';
import {
  READER_PROVIDERS,
  ReaderDraft,
  ReaderProvider,
  ReaderProviderType,
} from '@integration-hub/core/providers';

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
