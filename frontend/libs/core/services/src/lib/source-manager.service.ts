import { computed, inject, Injectable, signal } from '@angular/core';
import {
  SOURCE_PROVIDERS,
  SourceDraft,
  SourceProvider,
  SourceProviderType,
} from '@integration-hub/core/providers';

@Injectable({ providedIn: 'root' })
export class SourceManagerService {
  private readonly providers = inject(SOURCE_PROVIDERS, { optional: true }) ?? [];
  private readonly defaultType = this.providers[0]?.descriptor.type ?? 'FILESYSTEM';

  readonly selectedType = signal(this.defaultType);

  readonly availableProviders = computed(() =>
    this.providers.map((provider) => provider.descriptor)
  );

  readonly activeProvider = computed(
    () =>
      this.providers.find((provider) => provider.supports(this.selectedType())) ??
      this.providers[0] ??
      null
  );

  readonly activeDraft = computed(() => this.activeProvider()?.createDraft() ?? null);

  select(type: SourceProviderType): void {
    if (this.providers.some((provider) => provider.supports(type))) {
      this.selectedType.set(type);
    }
  }

  resolve(type: SourceProviderType): SourceProvider | null {
    return this.providers.find((provider) => provider.supports(type)) ?? null;
  }

  createDraftFor(type: SourceProviderType): SourceDraft {
    return this.resolve(type)?.createDraft() ?? {
      type,
      connectionKind: type.toLowerCase(),
      pollingMode: 'manual',
      includePatterns: ['*.*'],
    };
  }

  hydrateDraft(type: SourceProviderType, configurationJson: string): SourceDraft {
    return this.resolve(type)?.hydrateDraft(configurationJson) ?? this.createDraftFor(type);
  }

  serializeDraft(type: SourceProviderType, draft: SourceDraft): string {
    return this.resolve(type)?.toConfigurationJson(draft) ?? JSON.stringify(draft, null, 2);
  }
}
