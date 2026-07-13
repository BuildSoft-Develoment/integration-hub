import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { ResourcePresentation } from '@integration-hub/shared/models';
import {
  SOURCE_PROVIDERS,
  SourceDraft,
  SourceProvider,
  SourceProviderType,
  RemoteSourceCatalogItem,
  RemoteSchemaSourceProvider,
} from '@integration-hub/core/providers';
import { firstValueFrom } from 'rxjs';
import { SOURCE_PRESENTATION } from '../presentation/resource-presentation.maps';

interface SourceTypeCatalogResponse {
  readonly sourceTypes: RemoteSourceCatalogItem[];
}

/** Presentacion visual por defecto para source types aportados por plugins backend. */
const REMOTE_SOURCE_PRESENTATION: ResourcePresentation = {
  icon: 'cpu',
  toneClass: 'ih-tone-integration',
};

@Injectable({ providedIn: 'root' })
export class SourceManagerService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly localProviders = inject(SOURCE_PROVIDERS, { optional: true }) ?? [];
  private readonly remoteProviders = signal<SourceProvider[]>([]);
  private readonly defaultType = this.localProviders[0]?.descriptor.type ?? 'FILESYSTEM';

  readonly remoteCatalogLoading = signal(false);
  readonly remoteCatalogError = signal<string | null>(null);

  readonly selectedType = signal<SourceProviderType>(this.defaultType);

  /** Providers locales (build) + remotos (plugin), en un unico catalogo reactivo. */
  private readonly allProviders = computed<readonly SourceProvider[]>(() => [
    ...this.localProviders,
    ...this.remoteProviders(),
  ]);

  readonly availableProviders = computed(() =>
    this.allProviders().map((provider) => provider.descriptor)
  );

  readonly activeProvider = computed(
    () =>
      this.allProviders().find((provider) => provider.supports(this.selectedType())) ??
      this.allProviders()[0] ??
      null
  );

  readonly activeDraft = computed(() => this.activeProvider()?.createDraft() ?? null);

  /**
   * Descubre los source types remotos publicados por plugins backend
   * (`GET /api/source-types`) y los agrega al catalogo como
   * {@link RemoteSchemaSourceProvider}. Idempotente: se puede reinvocar tras instalar
   * un plugin. Los tipos remotos sombreados por un local (`SHADOWED_BY_LOCAL`) se omiten.
   */
  async loadRemoteSourceTypes(): Promise<void> {
    if (!this.http) {
      return;
    }
    this.remoteCatalogLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<SourceTypeCatalogResponse>('/api/source-types')
      );
      const localTypes = new Set(
        this.localProviders.map((provider) => normalizeType(provider.descriptor.type))
      );
      const remoteProviders = (response.sourceTypes ?? [])
        .filter((item) => normalizeType(item.origin) === 'REMOTE')
        .filter((item) => item.type?.trim())
        .filter((item) => !localTypes.has(normalizeType(item.type)))
        .map((item) => new RemoteSchemaSourceProvider(item));
      this.remoteProviders.set(remoteProviders);
      this.remoteCatalogError.set(null);
    } catch {
      this.remoteCatalogError.set('sources.remoteCatalogError');
      this.remoteProviders.set([]);
    } finally {
      this.remoteCatalogLoading.set(false);
    }
  }

  select(type: SourceProviderType): void {
    if (this.allProviders().some((provider) => provider.supports(type))) {
      this.selectedType.set(type);
    }
  }

  resolve(type: SourceProviderType): SourceProvider | null {
    return this.allProviders().find((provider) => provider.supports(type)) ?? null;
  }

  /**
   * Presentacion visual (icono + tono) del tipo de fuente. Los tipos locales resuelven
   * via {@link SOURCE_PRESENTATION}; los remotos (plugin) usan una presentacion generica.
   */
  presentation(type: SourceProviderType): ResourcePresentation {
    return SOURCE_PRESENTATION[type as keyof typeof SOURCE_PRESENTATION] ?? REMOTE_SOURCE_PRESENTATION;
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

function normalizeType(value: unknown): string {
  return String(value || '').trim().toUpperCase();
}
