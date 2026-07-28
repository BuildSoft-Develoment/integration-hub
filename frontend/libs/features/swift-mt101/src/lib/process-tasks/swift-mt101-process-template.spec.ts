import { describe, expect, it } from 'vitest';

import { SWIFT_MT101_MASSIVE_TEMPLATE } from './swift-mt101-process-template';

/**
 * ADR-021: la cadena masiva es del VERTICAL, asi que su contenido se prueba aca.
 *
 * <p>Antes esto se verificaba en `process-editor.store.spec.ts`, aplicando un
 * `applyMassiveMt101Template()` que vivia en la store generica del editor: una feature del motor
 * probando un estandar. Ahora cada lado prueba su contrato — el editor, que ensambla CUALQUIER
 * plantilla registrada; el vertical, que la suya dice lo que tiene que decir.</p>
 */
describe('ADR-021 · plantilla masiva SWIFT MT101', () => {
  const tasks = SWIFT_MT101_MASSIVE_TEMPLATE.tasks;
  const byRef = (ref: string) => tasks.find((task) => task.ref === ref);

  it('encadena los 6 pasos en orden', () => {
    expect(tasks.map((task) => task.taskType)).toEqual([
      'FILE_READ',
      'DB_WRITE',
      'MT101_BUILD_FROM_TABLE',
      'MT101_VALIDATE',
      'MT101_ARCHIVE',
      'MT101_PAY',
    ]);
  });

  it('el camino paginado va FILE_READ -> staging_record -> build por tabla', () => {
    expect(byRef('staging')?.overrides).toMatchObject({
      targetTable: 'staging_record',
      jdbcBatchSize: 5000,
      input: { sourceTaskRef: 'leer-archivo', sourceOutput: 'records' },
    });
    expect(byRef('build-mt101-masivo')?.overrides).toMatchObject({
      input: { sourceTaskRef: 'staging', sourceOutput: 'table' },
      fragmentSetIdTemplate: 'MT101-${_processExecutionId}',
      replaceExisting: true,
      maxTransactionsPerMessage: 100,
      maxBytesPerMessage: 10000,
    });
    // BUILD_FROM_TABLE no lee maxRecordsInOutput (solo ARCHIVE y PAY): sembrarlo seria config muerta.
    expect(byRef('build-mt101-masivo')?.overrides['maxRecordsInOutput']).toBeUndefined();
  });

  it('VALIDATE / ARCHIVE / PAY consumen los FRAGMENTOS del build, una sola vez', () => {
    for (const ref of ['validar', 'archivar', 'pagar']) {
      expect(byRef(ref)?.overrides, ref).toMatchObject({
        executionMode: 'once',
        input: { sourceTaskRef: 'build-mt101-masivo', sourceOutput: 'fragments' },
        pageSize: 200,
      });
    }
  });

  it('VALIDATE publica sus issues a tabla y ARCHIVE/PAY acotan la salida', () => {
    expect(byRef('validar')?.overrides).toMatchObject({
      publishIssuesTo: 'table:mt101_validation_issue',
      maxIssuesInOutput: 1000,
    });
    expect(byRef('archivar')?.overrides).toMatchObject({ maxRecordsInOutput: 1000 });
    expect(byRef('pagar')?.overrides).toMatchObject({ maxRecordsInOutput: 1000 });
  });
});
