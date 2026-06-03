// @trace RF-003 (conexiones: contrato configuration_json JDBC + secretos ${secret:...}) motor ORACLE
import { Injectable } from '@angular/core';
import { ConnectionDraft, ConnectionProvider } from '../../connections/connection-provider.abstract';

@Injectable()
export class OracleConnectionProvider extends ConnectionProvider {
  override readonly descriptor = {
    type: 'ORACLE',
    label: 'Oracle',
    description: 'Datasource JDBC para Oracle con pool configurable y SQL inicial opcional.',
    category: 'JDBC',
    capabilities: ['Pool JDBC', 'SQL inicial', 'Propiedades JDBC'],
  } as const;

  override createDraft(): ConnectionDraft {
    return createJdbcDraft('ORACLE');
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): ConnectionDraft {
    return hydrateJdbcDraft('ORACLE', configuration);
  }

  protected override toConfigurationObject(draft: ConnectionDraft): Record<string, unknown> {
    return toJdbcConfigurationObject(draft, this.parseJsonObject(draft.jdbcPropertiesJson));
  }
}

function createJdbcDraft(type: ConnectionDraft['type']): ConnectionDraft {
  return {
    type,
    family: 'jdbc',
    jdbcUrl: '',
    username: '',
    password: '',
    minSize: '0',
    maxSize: '10',
    acquisitionTimeoutSeconds: '30',
    validationTimeoutSeconds: '5',
    reapTimeoutMinutes: '5',
    initialSql: '',
    jdbcPropertiesJson: '{}',
  };
}

function hydrateJdbcDraft(
  type: ConnectionDraft['type'],
  configuration: Record<string, unknown>
): ConnectionDraft {
  const defaults = createJdbcDraft(type);
  return {
    ...defaults,
    jdbcUrl: String(configuration['jdbcUrl'] ?? ''),
    username: String(configuration['username'] ?? ''),
    password: String(configuration['password'] ?? ''),
    minSize: String(configuration['minSize'] ?? defaults.minSize ?? '0'),
    maxSize: String(configuration['maxSize'] ?? defaults.maxSize ?? '10'),
    acquisitionTimeoutSeconds: String(
      configuration['acquisitionTimeoutSeconds'] ?? defaults.acquisitionTimeoutSeconds ?? '30'
    ),
    validationTimeoutSeconds: String(
      configuration['validationTimeoutSeconds'] ?? defaults.validationTimeoutSeconds ?? '5'
    ),
    reapTimeoutMinutes: String(
      configuration['reapTimeoutMinutes'] ?? defaults.reapTimeoutMinutes ?? '5'
    ),
    initialSql: String(configuration['initialSql'] ?? ''),
    jdbcPropertiesJson: JSON.stringify(configuration['jdbcProperties'] ?? {}, null, 2),
  };
}

function toJdbcConfigurationObject(
  draft: ConnectionDraft,
  jdbcProperties: Record<string, unknown>
): Record<string, unknown> {
  return {
    jdbcUrl: draft.jdbcUrl || '',
    ...(draft.username ? { username: draft.username } : {}),
    ...(draft.password ? { password: draft.password } : {}),
    minSize: Number(draft.minSize || 0),
    maxSize: Number(draft.maxSize || 10),
    acquisitionTimeoutSeconds: Number(draft.acquisitionTimeoutSeconds || 30),
    validationTimeoutSeconds: Number(draft.validationTimeoutSeconds || 5),
    reapTimeoutMinutes: Number(draft.reapTimeoutMinutes || 5),
    ...(draft.initialSql ? { initialSql: draft.initialSql } : {}),
    ...(Object.keys(jdbcProperties).length ? { jdbcProperties } : {}),
  };
}
