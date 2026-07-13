import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { ResourcePresentation } from '@integration-hub/shared/models';
import {
  READER_PROVIDERS,
  ReaderDraft,
  ReaderProvider,
  ReaderProviderType,
  RemoteReaderCatalogItem,
  RemoteSchemaReaderProvider,
} from '@integration-hub/core/providers';
import { firstValueFrom } from 'rxjs';
import { READER_PRESENTATION } from '../presentation/resource-presentation.maps';

interface ReaderTypeCatalogResponse {
  readonly readerTypes: RemoteReaderCatalogItem[];
}

/** Presentacion visual por defecto para reader types aportados por plugins backend. */
const REMOTE_READER_PRESENTATION: ResourcePresentation = {
  icon: 'cpu',
  toneClass: 'ih-tone-integration',
};

@Injectable({ providedIn: 'root' })
export class ReaderManagerService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly localProviders = inject(READER_PROVIDERS, { optional: true }) ?? [];
  private readonly remoteProviders = signal<ReaderProvider[]>([]);
  private readonly defaultType = this.localProviders[0]?.descriptor.type ?? 'TXT';

  readonly remoteCatalogLoading = signal(false);
  readonly remoteCatalogError = signal<string | null>(null);

  readonly selectedType = signal<ReaderProviderType>(this.defaultType);

  /** Providers locales (build) + remotos (plugin), en un unico catalogo reactivo. */
  private readonly allProviders = computed<readonly ReaderProvider[]>(() => [
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

  /**
   * Descubre los reader types remotos publicados por plugins backend
   * (`GET /api/reader-types`) y los agrega al catalogo como
   * {@link RemoteSchemaReaderProvider}. Idempotente: se puede reinvocar tras instalar
   * un plugin. Los tipos remotos sombreados por un local (`SHADOWED_BY_LOCAL`) se omiten.
   */
  async loadRemoteReaderTypes(): Promise<void> {
    if (!this.http) {
      return;
    }
    this.remoteCatalogLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<ReaderTypeCatalogResponse>('/api/reader-types')
      );
      const localTypes = new Set(
        this.localProviders.map((provider) => normalizeType(provider.descriptor.type))
      );
      const remoteProviders = (response.readerTypes ?? [])
        .filter((item) => normalizeType(item.origin) === 'REMOTE')
        .filter((item) => item.type?.trim())
        .filter((item) => !localTypes.has(normalizeType(item.type)))
        .map((item) => new RemoteSchemaReaderProvider(item));
      this.remoteProviders.set(remoteProviders);
      this.remoteCatalogError.set(null);
    } catch {
      this.remoteCatalogError.set('readers.remoteCatalogError');
      this.remoteProviders.set([]);
    } finally {
      this.remoteCatalogLoading.set(false);
    }
  }

  select(type: ReaderProviderType): void {
    if (this.allProviders().some((provider) => provider.supports(type))) {
      this.selectedType.set(type);
    }
  }

  resolve(type: ReaderProviderType): ReaderProvider | null {
    return this.allProviders().find((provider) => provider.supports(type)) ?? null;
  }

  /**
   * Presentacion visual (icono + tono) del tipo de lector. Los tipos locales resuelven
   * via {@link READER_PRESENTATION}; los remotos (plugin) usan una presentacion generica.
   */
  presentation(type: ReaderProviderType): ResourcePresentation {
    return READER_PRESENTATION[type as keyof typeof READER_PRESENTATION] ?? REMOTE_READER_PRESENTATION;
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

function normalizeType(value: unknown): string {
  return String(value || '').trim().toUpperCase();
}
