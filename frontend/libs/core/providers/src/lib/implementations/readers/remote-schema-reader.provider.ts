import {
  ReaderDraft,
  ReaderProvider,
  ReaderProviderDescriptor,
  ReaderProviderStatus,
} from '../../readers/reader-provider.abstract';

/** Item del catalogo `/api/reader-types` (reader type remoto aportado por un plugin backend). */
export interface RemoteReaderCatalogItem {
  readonly type: string;
  readonly origin?: string;
  readonly provider?: string;
  readonly pluginId?: string | null;
  readonly pluginVersion?: string | null;
  readonly transport?: string | null;
  readonly status?: string | null;
  readonly reason?: string | null;
}

/**
 * Adaptador frontend para reader types remotos publicados por el backend.
 *
 * No trae un formulario hardcoded: `ReaderTypeFormHostComponent` consulta el
 * config-schema del backend (`GET /api/plugins/config-schema/{type}`) y renderiza
 * `ih-schema-form`. Este provider solo hace visible la capacidad en el selector y
 * round-trip-ea el `configuration_json` (el draft ES el objeto de configuracion),
 * manteniendo OCP para plugins instalados fuera del build Angular. Espejo de
 * `SchemaTaskProvider`.
 */
export class RemoteSchemaReaderProvider extends ReaderProvider {
  readonly descriptor: ReaderProviderDescriptor;

  constructor(item: RemoteReaderCatalogItem) {
    super();
    const type = normalizeType(item.type);
    this.descriptor = {
      type,
      label: humanizeRemoteType(type),
      description: '',
      category: 'Plugin',
      capabilities: ['schema-driven'],
      origin: 'REMOTE',
      pluginId: item.pluginId ?? null,
      pluginVersion: item.pluginVersion ?? null,
      transport: item.transport ?? null,
      status: normalizeStatus(item.status),
      reason: item.reason ?? null,
    };
  }

  override createDraft(): ReaderDraft {
    return { type: this.descriptor.type };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): ReaderDraft {
    // El draft de un reader remoto es el propio objeto de configuracion; el `type`
    // se re-impone desde el descriptor para no confiar en el JSON almacenado.
    return { ...configuration, type: this.descriptor.type } as ReaderDraft;
  }

  protected override toConfigurationObject(draft: ReaderDraft): Record<string, unknown> {
    // Se excluye el `type` del payload: no forma parte del contrato de configuracion.
    const { type: _type, ...rest } = draft as unknown as Record<string, unknown>;
    return rest;
  }
}

function normalizeType(type: string): string {
  return String(type || '').trim().toUpperCase();
}

function normalizeStatus(status: string | null | undefined): ReaderProviderStatus {
  const normalized = String(status || 'AVAILABLE').trim().toUpperCase();
  return normalized === 'DEGRADED'
    || normalized === 'UNTRUSTED'
    || normalized === 'SHADOWED_BY_LOCAL'
    ? (normalized as ReaderProviderStatus)
    : 'AVAILABLE';
}

function humanizeRemoteType(type: string): string {
  return type
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}
