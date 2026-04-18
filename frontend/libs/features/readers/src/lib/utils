import { describe, expect, it } from 'vitest';
import { CsvReaderProvider, XmlReaderProvider } from '../../../../libs/core/providers/src/lib/implementations/readers/reader.providers';

describe('Reader providers', () => {
  it('serializes CSV drafts into backend-compatible JSON', () => {
    const provider = new CsvReaderProvider();

    const json = provider.toConfigurationJson({
      ...provider.createDraft(),
      delimiter: ';',
      encoding: 'UTF-8',
      rowData: '2',
      fields: [
        { name: 'codigo', position: '1', type: 'TEXT', size: '10', required: true, defaultValue: '', script: '', pattern: '' },
      ],
    });

    expect(JSON.parse(json)).toEqual({
      delimiter: ';',
      encoding: 'UTF-8',
      rowData: 2,
      fields: [
        { name: 'codigo', position: 1, type: 'TEXT', size: 10, required: true },
      ],
    });
  });

  it('hydrates XML drafts from stored configuration', () => {
    const provider = new XmlReaderProvider();

    const draft = provider.hydrateDraft(
      JSON.stringify({
        recordElement: 'invoice',
        includeAttributes: false,
        trimValues: true,
        fieldMappings: {
          '@id': 'invoiceId',
          customer: 'customerName',
        },
      })
    );

    expect(draft.recordElement).toBe('invoice');
    expect(draft.includeAttributes).toBe(false);
    expect(draft.trimValues).toBe(true);
    expect(draft.fieldMappingsText).toContain('@id=invoiceId');
    expect(draft.fieldMappingsText).toContain('customer=customerName');
  });
});
