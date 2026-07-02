import { describe, expect, it } from 'vitest';
import { Mt101BuildFromTableTaskProvider } from './mt101-build-from-table-task.provider';

describe('Mt101BuildFromTableTaskProvider', () => {
  it('declares MT101_BUILD_FROM_TABLE and serializes massive limits', () => {
    const provider = new Mt101BuildFromTableTaskProvider();
    const draft = {
      ...provider.createDraft(),
      taskRef: 'build-massive',
      maxTransactionsPerMessage: 75,
    };

    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(provider.descriptor.type).toBe('MT101_BUILD_FROM_TABLE');
    expect(config.executionMode).toBe('once');
    expect(config.maxTransactionsPerMessage).toBe(75);
    expect(config.maxBytesPerMessage).toBe(10000);
    expect(config.replaceExisting).toBe(true);
  });

  it('defaults sendersReferenceTemplate with ${batchCode}${messageIndex} for cross-execution uniqueness', () => {
    // ${batchCode} unico por ejecucion + ${messageIndex} unico por fragmento:
    // evita choque en el indice de idempotencia entre lotes del mismo dia.
    const provider = new Mt101BuildFromTableTaskProvider();
    const draft = provider.createDraft();
    expect(draft.sequenceA.sendersReferenceTemplate).toBe('${batchCode}${messageIndex}');

    const config = JSON.parse(
      provider.toTaskPatch({ ...draft, taskRef: 'build-massive' }).configurationJson as string,
    );
    expect(config.sequenceA.sendersReferenceTemplate).toBe('${batchCode}${messageIndex}');
  });
});
