import { describe, expect, it } from 'vitest';
import { FileWriteTaskProvider } from './file-write-task.provider';

/**
 * ADR-016: contrato de serializacion del form FILE_WRITE. El draft hace round-trip por el
 * configurationJson en cada cambio (toTaskPatch -> hydrateDraft), asi que la serializacion NO debe
 * perder estado en edicion.
 */
describe('FileWriteTaskProvider', () => {
  const provider = new FileWriteTaskProvider();

  const roundTrip = (draft: ReturnType<FileWriteTaskProvider['createDraft']>) => {
    const patch = provider.toTaskPatch(draft);
    const task: any = { taskType: 'FILE_WRITE', configurationJson: patch.configurationJson };
    return provider.hydrateDraft(task);
  };

  it('preserva una columna recien agregada con field vacio (regresion: "Agregar" no hacia nada)', () => {
    const draft = provider.createDraft();
    // addColumn() agrega una columna vacia para que el usuario la llene.
    draft.columns = [{ field: 'ref' }, { field: '' }];

    const rehydrated = roundTrip(draft);

    // Antes se filtraba la columna vacia al serializar -> desaparecia en el round-trip -> "Agregar" no hacia nada.
    expect(rehydrated.columns.length).toBe(2);
    expect(rehydrated.columns[1].field).toBe('');
  });

  it('round-trips type/format/rounding de una columna NUMBER', () => {
    const draft = provider.createDraft();
    draft.columns = [{ field: 'monto', type: 'NUMBER', format: '0.00', rounding: 'HALF_EVEN' }];

    const rehydrated = roundTrip(draft);

    expect(rehydrated.columns[0]).toMatchObject({ field: 'monto', type: 'NUMBER', format: '0.00', rounding: 'HALF_EVEN' });
  });
});
