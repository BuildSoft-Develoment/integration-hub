import {
  SourceDraft,
  SourceProvider,
  SourceProviderDescriptor,
  SourceProviderStatus,
} from '../../sources/source-provider.abstract';

/** Item del catalogo `/api/source-types` (source type remoto aportado por un plugin backend). */
export interface RemoteSourceCatalogItem {
  readonly type: string;
  readonly origin?: string;
  readonly provider?: string;
  readonly pluginId?: string | null;
  readonly pluginVersion?: string | null;
  readonly transport?: string | null;
  readonly status?: string | null;
  readonly reason?: string | null;
}

/** Claves estructurales del SourceDraft que NO forman parte del configuration_json del plugin. */
const STRUCTURAL_KEYS = new Set(['type', 'connectionKind', 'pollingMode', 'includePatterns']);

/**
 * Adaptador frontend para source types remotos publicados por el backend.
 *
 * No trae un formulario hardcoded: `SourceTypeFormHostComponent` consulta el config-schema
 * del backend (`GET /api/plugins/config-schema/{type}`) y renderiza `ih-schema-form`. Este
 * provider solo hace visible la capacidad en el selector y round-trip-ea el `configuration_json`
 * (el draft lleva la config del plugin junto a los campos estructurales del source). Espejo de
 * `RemoteSchemaReaderProvider`.
 */
export class RemoteSchemaSourceProvider extends SourceProvider {
  readonly descriptor: SourceProviderDescriptor;

  constructor(item: RemoteSourceCatalogItem) {
    super();
    const type = normalizeType(item.type);
    this.descriptor = {
      type,
      label: humanizeRemoteType(type),
      description: '',
      category: 'Plugin',
      capabilities: ['schema-driven'],
      supportsConnectionSecret: false,
      origin: 'REMOTE',
      pluginId: item.pluginId ?? null,
      pluginVersion: item.pluginVersion ?? null,
      transport: item.transport ?? null,
      status: normalizeStatus(item.status),
      reason: item.reason ?? null,
    };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): SourceDraft {
    // El draft de un source remoto es la config del plugin sobre los campos estructurales base;
    // el `type` se re-impone desde el descriptor para no confiar en el JSON almacenado.
    return { ...this.createDraft(), ...configuration, type: this.descriptor.type };
  }

  protected override toConfigurationObject(draft: SourceDraft): Record<string, unknown> {
    // Se excluyen los campos estructurales del source: el configuration_json es solo la config del plugin.
    return Object.fromEntries(
      Object.entries(draft as unknown as Record<string, unknown>).filter(([key]) => !STRUCTURAL_KEYS.has(key)),
    );
  }
}

function normalizeType(type: string): string {
  return String(type || '').trim().toUpperCase();
}

function normalizeStatus(status: string | null | undefined): SourceProviderStatus {
  const normalized = String(status || 'AVAILABLE').trim().toUpperCase();
  return normalized === 'DEGRADED'
    || normalized === 'UNTRUSTED'
    || normalized === 'SHADOWED_BY_LOCAL'
    ? (normalized as SourceProviderStatus)
    : 'AVAILABLE';
}

function humanizeRemoteType(type: string): string {
  return type
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}
