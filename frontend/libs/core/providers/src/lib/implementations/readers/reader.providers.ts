// @trace spec 002-catalogo-readers RF-003 (catalogo-readers: contrato configuration_json por formato de reader)
import { Injectable } from '@angular/core';
import { ReaderDraft, ReaderFieldDraft, ReaderProvider } from '../../readers/reader-provider.abstract';

function defaultFieldDraft(variant: 'position' | 'range' = 'position'): ReaderFieldDraft {
  return variant === 'range'
    ? { name: '', start: '', end: '', type: 'TEXT', size: '', required: false, defaultValue: '', script: '', pattern: '' }
    : { name: '', position: '', type: 'TEXT', size: '', required: false, defaultValue: '', script: '', pattern: '' };
}

function parseFieldDraft(field: Record<string, unknown>, variant: 'position' | 'range'): ReaderFieldDraft {
  return {
    name: String(field['name'] ?? ''),
    position: variant === 'position' ? String(field['position'] ?? '') : '',
    start: variant === 'range' ? String(field['start'] ?? '') : '',
    end: variant === 'range' ? String(field['end'] ?? '') : '',
    type: (field['type'] as 'TEXT' | 'NUMBER' | 'DATE') || 'TEXT',
    size: String(field['size'] ?? ''),
    required: Boolean(field['required']),
    defaultValue: String(field['defaultValue'] ?? ''),
    script: String(field['script'] ?? ''),
    pattern: String(field['pattern'] ?? ''),
  };
}

function serializeFieldDraft(field: ReaderFieldDraft, variant: 'position' | 'range'): Record<string, unknown> | null {
  const name = String(field.name || '').trim();
  if (!name) {
    return null;
  }

  const serialized: Record<string, unknown> = {
    name,
    type: field.type || 'TEXT',
  };

  if (variant === 'range') {
    const start = String(field.start || '').trim();
    const end = String(field.end || '').trim();
    if (start) {
      serialized['start'] = Number(start);
    }
    if (end) {
      serialized['end'] = Number(end);
    }
  } else {
    const position = String(field.position || '').trim();
    if (position) {
      serialized['position'] = Number(position);
    }
  }

  const size = String(field.size || '').trim();
  if (size) {
    serialized['size'] = Number(size);
  }
  if (field.required) {
    serialized['required'] = true;
  }
  ['defaultValue', 'script', 'pattern'].forEach((key) => {
    const value = String(field[key as keyof ReaderFieldDraft] || '').trim();
    if (value) {
      serialized[key] = value;
    }
  });
  return serialized;
}

@Injectable()
export class TxtReaderProvider extends ReaderProvider {
  readonly descriptor = {
    type: 'TXT',
    label: 'TXT',
    description: 'Lectura de archivos planos delimitados o fixed-length.',
    category: 'Text',
    capabilities: ['delimited', 'fixed-length', 'field-definitions'],
  } as const;

  override createDraft(): ReaderDraft {
    return {
      type: 'TXT',
      mode: 'delimited',
      delimiter: '|',
      encoding: 'UTF-8',
      rowData: '1',
      fields: [defaultFieldDraft('position')],
      fixedFields: [defaultFieldDraft('range')],
    };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): ReaderDraft {
    const draft = this.createDraft();
    const fields = Array.isArray(configuration['fields']) ? configuration['fields'] as Record<string, unknown>[] : [];
    const mode = String(configuration['mode'] || draft.mode);
    return {
      ...draft,
      mode: mode === 'fixed-length' ? 'fixed-length' : 'delimited',
      delimiter: String(configuration['delimiter'] || draft.delimiter),
      encoding: String(configuration['encoding'] || draft.encoding),
      rowData: String(configuration['rowData'] ?? configuration['dataStartRowIndex'] ?? draft.rowData),
      fields: mode === 'fixed-length' ? draft.fields : (fields.length ? fields.map((field) => parseFieldDraft(field, 'position')) : draft.fields),
      fixedFields: mode === 'fixed-length' ? (fields.length ? fields.map((field) => parseFieldDraft(field, 'range')) : draft.fixedFields) : draft.fixedFields,
    };
  }

  protected override toConfigurationObject(draft: ReaderDraft): Record<string, unknown> {
    const fixedMode = draft.mode === 'fixed-length';
    const fields = (fixedMode ? draft.fixedFields : draft.fields)
      ?.map((field) => serializeFieldDraft(field, fixedMode ? 'range' : 'position'))
      .filter(Boolean) ?? [];

    return {
      mode: fixedMode ? 'fixed-length' : 'delimited',
      encoding: draft.encoding || 'UTF-8',
      rowData: Number(draft.rowData || 1),
      ...(fixedMode ? {} : { delimiter: draft.delimiter || '|' }),
      ...(fields.length ? { fields } : {}),
    };
  }
}

@Injectable()
export class CsvReaderProvider extends ReaderProvider {
  readonly descriptor = {
    type: 'CSV',
    label: 'CSV',
    description: 'Lectura tabular delimitada por columnas.',
    category: 'Delimited',
    capabilities: ['delimiter', 'field-definitions'],
  } as const;

  override createDraft(): ReaderDraft {
    return {
      type: 'CSV',
      delimiter: ',',
      encoding: 'UTF-8',
      rowData: '1',
      fields: [defaultFieldDraft('position')],
    };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): ReaderDraft {
    const draft = this.createDraft();
    const fields = Array.isArray(configuration['fields']) ? configuration['fields'] as Record<string, unknown>[] : [];
    return {
      ...draft,
      delimiter: String(configuration['delimiter'] || draft.delimiter),
      encoding: String(configuration['encoding'] || draft.encoding),
      rowData: String(configuration['rowData'] ?? draft.rowData),
      fields: fields.length ? fields.map((field) => parseFieldDraft(field, 'position')) : draft.fields,
    };
  }

  protected override toConfigurationObject(draft: ReaderDraft): Record<string, unknown> {
    const fields = draft.fields?.map((field) => serializeFieldDraft(field, 'position')).filter(Boolean) ?? [];
    return {
      delimiter: draft.delimiter || ',',
      encoding: draft.encoding || 'UTF-8',
      rowData: Number(draft.rowData || 1),
      ...(fields.length ? { fields } : {}),
    };
  }
}

abstract class ExcelReaderProviderBase extends ReaderProvider {
  protected createExcelDraft(type: 'XLS' | 'XLSX'): ReaderDraft {
    return {
      type,
      sheetIndex: '0',
      rowData: '1',
      trimValues: true,
      fields: [defaultFieldDraft('position')],
    };
  }

  protected hydrateExcelDraft(type: 'XLS' | 'XLSX', configuration: Record<string, unknown>): ReaderDraft {
    const draft = this.createExcelDraft(type);
    const fields = Array.isArray(configuration['fields']) ? configuration['fields'] as Record<string, unknown>[] : [];
    return {
      ...draft,
      sheetIndex: String(configuration['sheetIndex'] ?? draft.sheetIndex),
      rowData: String(configuration['rowData'] ?? configuration['dataStartRowIndex'] ?? draft.rowData),
      trimValues: configuration['trimValues'] === undefined ? draft.trimValues : Boolean(configuration['trimValues']),
      fields: fields.length ? fields.map((field) => parseFieldDraft(field, 'position')) : draft.fields,
    };
  }

  protected toExcelConfigurationObject(draft: ReaderDraft): Record<string, unknown> {
    const fields = draft.fields?.map((field) => serializeFieldDraft(field, 'position')).filter(Boolean) ?? [];
    return {
      sheetIndex: Number(draft.sheetIndex || 0),
      rowData: Number(draft.rowData || 1),
      trimValues: Boolean(draft.trimValues),
      ...(fields.length ? { fields } : {}),
    };
  }
}

@Injectable()
export class XlsReaderProvider extends ExcelReaderProviderBase {
  readonly descriptor = {
    type: 'XLS',
    label: 'XLS',
    description: 'Lectura de hojas Excel formato binario.',
    category: 'Spreadsheet',
    capabilities: ['sheet-index', 'field-definitions'],
  } as const;

  override createDraft(): ReaderDraft {
    return this.createExcelDraft('XLS');
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): ReaderDraft {
    return this.hydrateExcelDraft('XLS', configuration);
  }

  protected override toConfigurationObject(draft: ReaderDraft): Record<string, unknown> {
    return this.toExcelConfigurationObject(draft);
  }
}

@Injectable()
export class XlsxReaderProvider extends ExcelReaderProviderBase {
  readonly descriptor = {
    type: 'XLSX',
    label: 'XLSX',
    description: 'Lectura de hojas Excel formato OpenXML.',
    category: 'Spreadsheet',
    capabilities: ['sheet-index', 'field-definitions'],
  } as const;

  override createDraft(): ReaderDraft {
    return this.createExcelDraft('XLSX');
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): ReaderDraft {
    return this.hydrateExcelDraft('XLSX', configuration);
  }

  protected override toConfigurationObject(draft: ReaderDraft): Record<string, unknown> {
    return this.toExcelConfigurationObject(draft);
  }
}

@Injectable()
export class JsonReaderProvider extends ReaderProvider {
  readonly descriptor = {
    type: 'JSON',
    label: 'JSON',
    description: 'Lectura de payloads JSON con mapeos opcionales.',
    category: 'Structured',
    capabilities: ['raw-json'],
  } as const;

  override createDraft(): ReaderDraft {
    return {
      type: 'JSON',
      fieldMappingsText: '',
    };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): ReaderDraft {
    return {
      ...this.createDraft(),
      fieldMappingsText: this.stringifyFieldMappings(configuration['fieldMappings']),
    };
  }

  protected override toConfigurationObject(draft: ReaderDraft): Record<string, unknown> {
    const fieldMappings = this.parseFieldMappings(draft.fieldMappingsText);
    return {
      ...(Object.keys(fieldMappings).length ? { fieldMappings } : {}),
    };
  }
}

@Injectable()
export class XmlReaderProvider extends ReaderProvider {
  readonly descriptor = {
    type: 'XML',
    label: 'XML',
    description: 'Lectura estructurada con record element y atributos.',
    category: 'Structured',
    capabilities: ['record-element', 'attributes', 'field-mappings'],
  } as const;

  override createDraft(): ReaderDraft {
    return {
      type: 'XML',
      recordElement: '',
      includeAttributes: true,
      trimValues: true,
      fieldMappingsText: '',
    };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): ReaderDraft {
    const draft = this.createDraft();
    return {
      ...draft,
      recordElement: String(configuration['recordElement'] || ''),
      includeAttributes: configuration['includeAttributes'] === undefined ? draft.includeAttributes : Boolean(configuration['includeAttributes']),
      trimValues: configuration['trimValues'] === undefined ? draft.trimValues : Boolean(configuration['trimValues']),
      fieldMappingsText: this.stringifyFieldMappings(configuration['fieldMappings']),
    };
  }

  protected override toConfigurationObject(draft: ReaderDraft): Record<string, unknown> {
    const fieldMappings = this.parseFieldMappings(draft.fieldMappingsText);
    return {
      ...(draft.recordElement?.trim() ? { recordElement: draft.recordElement.trim() } : {}),
      includeAttributes: Boolean(draft.includeAttributes),
      trimValues: Boolean(draft.trimValues),
      ...(Object.keys(fieldMappings).length ? { fieldMappings } : {}),
    };
  }
}

@Injectable()
export class SwiftMtReaderProvider extends ReaderProvider {
  readonly descriptor = {
    type: 'SWIFT_MT',
    label: 'SWIFT MT/FIN',
    description: 'Lectura de mensajes SWIFT FIN crudos con blocks 1-5.',
    category: 'Payments',
    capabilities: ['swift-fin', 'mt101', 'block-parser'],
  } as const;

  override createDraft(): ReaderDraft {
    return {
      type: 'SWIFT_MT',
      encoding: 'UTF-8',
      rejectNonSwiftXChars: false,
    };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): ReaderDraft {
    const draft = this.createDraft();
    return {
      ...draft,
      encoding: String(configuration['encoding'] || draft.encoding),
      rejectNonSwiftXChars: Boolean(configuration['rejectNonSwiftXChars']),
    };
  }

  protected override toConfigurationObject(draft: ReaderDraft): Record<string, unknown> {
    return {
      encoding: draft.encoding || 'UTF-8',
      rejectNonSwiftXChars: Boolean(draft.rejectNonSwiftXChars),
    };
  }
}
