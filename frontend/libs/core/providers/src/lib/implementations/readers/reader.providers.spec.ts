import { describe, expect, it } from 'vitest';
import { SwiftMtReaderProvider } from './reader.providers';

describe('SwiftMtReaderProvider', () => {
  it('declares SWIFT_MT with FIN capabilities', () => {
    const provider = new SwiftMtReaderProvider();

    expect(provider.descriptor.type).toBe('SWIFT_MT');
    expect(provider.descriptor.capabilities).toContain('swift-fin');
  });

  it('serializes and hydrates SWIFT MT reader configuration', () => {
    const provider = new SwiftMtReaderProvider();
    const configurationJson = provider.toConfigurationJson({
      ...provider.createDraft(),
      encoding: 'ISO-8859-1',
      rejectNonSwiftXChars: true,
    });

    expect(JSON.parse(configurationJson)).toEqual({
      encoding: 'ISO-8859-1',
      rejectNonSwiftXChars: true,
    });
    expect(provider.hydrateDraft(configurationJson)).toEqual({
      type: 'SWIFT_MT',
      encoding: 'ISO-8859-1',
      rejectNonSwiftXChars: true,
    });
  });
});
