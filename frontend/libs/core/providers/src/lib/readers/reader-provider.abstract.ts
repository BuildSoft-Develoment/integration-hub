export type ReaderProviderType = 'TXT' | 'CSV' | 'XLS' | 'XLSX' | 'JSON' | 'XML';

export type ReaderFieldVariant = 'position' | 'range';

export interface ReaderFieldDraft {
  name: string;
  position?: string;
  start?: string;
  end?: string;
  type: 'TEXT' | 'NUMBER' | 'DATE';
  size?: string;
  required?: boolean;
  defaultValue?: string;
  script?: string;
  pattern?: string;
}

export interface ReaderDraft {
  type: ReaderProviderType;
  mode?: 'delimited' | 'fixed-length';
  delimiter?: string;
  encoding?: string;
  rowData?: string;
  fields?: ReaderFieldDraft[];
  fixedFields?: ReaderFieldDraft[];
  sheetIndex?: string;
  trimValues?: boolean;
  recordElement?: string;
  includeAttributes?: boolean;
  fieldMappingsText?: string;
}

export interface ReaderProviderDescriptor {
  type: ReaderProviderType;
  label: string;
  description: string;
  category: string;
  capabilities: readonly string[];
}

export abstract class ReaderProvider {
  abstract readonly descriptor: ReaderProviderDescriptor;

  supports(type: string): boolean {
    return this.descriptor.type === type;
  }

  createDraft(): ReaderDraft {
    return {
      type: this.descriptor.type,
    };
  }

  hydrateDraft(configurationJson: string): ReaderDraft {
    try {
      return this.hydrateDraftFromObject(JSON.parse(configurationJson || '{}'));
    } catch {
      return this.createDraft();
    }
  }

  toConfigurationJson(draft: ReaderDraft): string {
    return JSON.stringify(this.toConfigurationObject(draft), null, 2);
  }

  protected hydrateDraftFromObject(configuration: Record<string, unknown>): ReaderDraft {
    return {
      ...this.createDraft(),
      ...configuration,
    };
  }

  protected toConfigurationObject(draft: ReaderDraft): Record<string, unknown> {
    return {
      ...draft,
    };
  }

  protected parseFieldMappings(fieldMappingsText?: string): Record<string, string> {
    return (fieldMappingsText || '')
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

  protected stringifyFieldMappings(fieldMappings: unknown): string {
    return Object.entries((fieldMappings as Record<string, string>) ?? {})
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
  }
}
