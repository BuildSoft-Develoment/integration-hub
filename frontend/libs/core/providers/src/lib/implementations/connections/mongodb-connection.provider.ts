import { Injectable } from '@angular/core';
import { ConnectionDraft, ConnectionProvider } from '../../connections/connection-provider.abstract';

@Injectable()
export class MongoDbConnectionProvider extends ConnectionProvider {
  override readonly descriptor = {
    type: 'MONGODB',
    label: 'MongoDB',
    description: 'Conexion MongoDB catalogada y lista para pruebas de conectividad.',
    category: 'Document',
    capabilities: ['Cadena de conexión', 'Timeouts', 'Base de datos'],
  } as const;

  override createDraft(): ConnectionDraft {
    return {
      type: 'MONGODB',
      family: 'mongodb',
      connectionString: '',
      database: '',
      connectTimeoutMillis: '10000',
      readTimeoutMillis: '30000',
    };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): ConnectionDraft {
    const defaults = this.createDraft();
    return {
      ...defaults,
      connectionString: String(configuration['connectionString'] ?? ''),
      database: String(configuration['database'] ?? ''),
      connectTimeoutMillis: String(
        configuration['connectTimeoutMillis'] ?? defaults.connectTimeoutMillis ?? '10000'
      ),
      readTimeoutMillis: String(
        configuration['readTimeoutMillis'] ?? defaults.readTimeoutMillis ?? '30000'
      ),
    };
  }

  protected override toConfigurationObject(draft: ConnectionDraft): Record<string, unknown> {
    return {
      connectionString: draft.connectionString || '',
      ...(draft.database ? { database: draft.database } : {}),
      connectTimeoutMillis: Number(draft.connectTimeoutMillis || 10000),
      readTimeoutMillis: Number(draft.readTimeoutMillis || 30000),
    };
  }
}
