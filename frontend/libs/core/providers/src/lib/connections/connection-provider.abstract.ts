export type ConnectionProviderType =
  | 'ORACLE'
  | 'POSTGRESQL'
  | 'SQLSERVER'
  | 'MYSQL'
  | 'MONGODB';

export interface ConnectionDraft {
  type: ConnectionProviderType;
  family: 'jdbc' | 'mongodb';
  jdbcUrl?: string;
  username?: string;
  password?: string;
  minSize?: string;
  maxSize?: string;
  acquisitionTimeoutSeconds?: string;
  validationTimeoutSeconds?: string;
  reapTimeoutMinutes?: string;
  initialSql?: string;
  jdbcPropertiesJson?: string;
  connectionString?: string;
  database?: string;
  connectTimeoutMillis?: string;
  readTimeoutMillis?: string;
}

export interface ConnectionProviderDescriptor {
  type: ConnectionProviderType;
  label: string;
  description: string;
  category: string;
  capabilities: readonly string[];
}

export abstract class ConnectionProvider {
  abstract readonly descriptor: ConnectionProviderDescriptor;

  supports(type: string): boolean {
    return this.descriptor.type === type;
  }

  createDraft(): ConnectionDraft {
    return {
      type: this.descriptor.type,
      family: 'jdbc',
    };
  }

  hydrateDraft(configurationJson: string): ConnectionDraft {
    try {
      return this.hydrateDraftFromObject(JSON.parse(configurationJson || '{}'));
    } catch {
      return this.createDraft();
    }
  }

  toConfigurationJson(draft: ConnectionDraft): string {
    return JSON.stringify(this.toConfigurationObject(draft), null, 2);
  }

  protected hydrateDraftFromObject(configuration: Record<string, unknown>): ConnectionDraft {
    return {
      ...this.createDraft(),
      ...configuration,
    };
  }

  protected toConfigurationObject(draft: ConnectionDraft): Record<string, unknown> {
    return {
      ...draft,
    };
  }

  protected parseJsonObject(value?: string): Record<string, unknown> {
    if (!value?.trim()) {
      return {};
    }
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
}
