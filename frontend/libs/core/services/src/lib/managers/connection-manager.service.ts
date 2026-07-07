import { computed, inject, Injectable, signal } from '@angular/core';
import { ResourcePresentation } from '@integration-hub/shared/models';
import {
  CONNECTION_PROVIDERS,
  ConnectionDraft,
  ConnectionProvider,
  ConnectionProviderType,
} from '@integration-hub/core/providers';
import { CONNECTION_PRESENTATION } from '../presentation/resource-presentation.maps';

@Injectable({ providedIn: 'root' })
export class ConnectionManagerService {
  private readonly providers = inject(CONNECTION_PROVIDERS, { optional: true }) ?? [];
  private readonly defaultType = this.providers[0]?.descriptor.type ?? 'POSTGRESQL';

  readonly selectedType = signal<ConnectionProviderType>(this.defaultType);

  readonly availableProviders = computed(() =>
    this.providers.map((provider) => provider.descriptor)
  );

  readonly activeProvider = computed(
    () =>
      this.providers.find((provider) => provider.supports(this.selectedType())) ??
      this.providers[0] ??
      null
  );

  select(type: ConnectionProviderType): void {
    if (this.providers.some((provider) => provider.supports(type))) {
      this.selectedType.set(type);
    }
  }

  resolve(type: ConnectionProviderType): ConnectionProvider | null {
    return this.providers.find((provider) => provider.supports(type)) ?? null;
  }

  /**
   * Presentacion visual (icono + tono) del tipo de conexion. Resolucion total
   * via {@link CONNECTION_PRESENTATION}: siempre devuelve una presentacion
   * concreta, sin fallback en runtime.
   */
  presentation(type: ConnectionProviderType): ResourcePresentation {
    return CONNECTION_PRESENTATION[type];
  }

  createDraftFor(type: ConnectionProviderType): ConnectionDraft {
    return this.resolve(type)?.createDraft() ?? {
      type,
      family: type === 'MONGODB' ? 'mongodb' : 'jdbc',
    };
  }

  hydrateDraft(type: ConnectionProviderType, configurationJson: string): ConnectionDraft {
    return this.resolve(type)?.hydrateDraft(configurationJson) ?? this.createDraftFor(type);
  }

  serializeDraft(type: ConnectionProviderType, draft: ConnectionDraft): string {
    return this.resolve(type)?.toConfigurationJson(draft) ?? JSON.stringify(draft, null, 2);
  }
}
