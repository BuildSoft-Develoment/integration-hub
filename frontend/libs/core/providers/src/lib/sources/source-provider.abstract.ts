export type SourceProviderType = 'FILESYSTEM' | 'FTP' | 'SFTP' | 'REST';

export interface SourceDraft {
  type: SourceProviderType;
  connectionKind: string;
  pollingMode: 'manual' | 'scheduled';
  includePatterns: string[];
  path?: string;
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  remotePath?: string;
  privateKeyPath?: string;
  passphrase?: string;
  strictHostKeyChecking?: boolean;
  passiveMode?: boolean;
  timeoutMillis?: string;
  timeoutSeconds?: string;
  fileNameTemplate?: string;
  templateVariablesText?: string;
  selectionMode?: 'latestModified' | 'single' | 'all';
  fileErrorPolicy?: 'failFast' | 'continue';
  mediaType?: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  authType?: '' | 'basic' | 'bearer';
  token?: string;
  fileName?: string;
  headersJson?: string;
  body?: string;
}

export interface SourceProviderDescriptor {
  type: SourceProviderType;
  label: string;
  description: string;
  category: string;
  capabilities: readonly string[];
  supportsConnectionSecret: boolean;
}

export abstract class SourceProvider {
  abstract readonly descriptor: SourceProviderDescriptor;

  supports(type: string): boolean {
    return this.descriptor.type === type;
  }

  createDraft(): SourceDraft {
    return {
      type: this.descriptor.type,
      connectionKind: this.descriptor.type.toLowerCase(),
      pollingMode: 'manual',
      includePatterns: ['*.*'],
    };
  }

  hydrateDraft(configurationJson: string): SourceDraft {
    try {
      return this.hydrateDraftFromObject(JSON.parse(configurationJson || '{}'));
    } catch {
      return this.createDraft();
    }
  }

  toConfigurationJson(draft: SourceDraft): string {
    return JSON.stringify(this.toConfigurationObject(draft), null, 2);
  }

  protected hydrateDraftFromObject(configuration: Record<string, unknown>): SourceDraft {
    return {
      ...this.createDraft(),
      ...configuration,
    };
  }

  protected toConfigurationObject(draft: SourceDraft): Record<string, unknown> {
    return {
      ...draft,
    };
  }

  protected parseTemplateVariables(templateVariablesText?: string): Record<string, string> {
    return (templateVariablesText || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((accumulator, line) => {
        const [key, ...valueParts] = line.split('=');
        if (!key || valueParts.length === 0) {
          return accumulator;
        }

        const normalizedKey = key.trim();
        const normalizedValue = valueParts.join('=').trim();

        if (normalizedKey && normalizedValue) {
          accumulator[normalizedKey] = normalizedValue;
        }

        return accumulator;
      }, {});
  }

  protected stringifyTemplateVariables(templateVariables: unknown): string {
    return Object.entries((templateVariables as Record<string, string>) ?? {})
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
  }
}
