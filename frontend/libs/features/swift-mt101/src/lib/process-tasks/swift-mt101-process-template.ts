import { Provider } from '@angular/core';
import { ProcessTemplateRegistration, provideProcessTemplate } from '@integration-hub/core/providers';

/** `taskRef` de la tarea de construccion; las de abajo se enganchan a sus fragmentos. */
const BUILD_REF = 'build-mt101-masivo';

const FRAGMENTS_INPUT = {
  source: 'task-output' as const,
  sourceTaskRef: BUILD_REF,
  sourceOutput: 'fragments' as const,
};

/**
 * ADR-021: la cadena masiva MT101, aportada POR EL VERTICAL.
 *
 * <p>Vivia dentro de `ProcessEditorStore` como `applyMassiveMt101Template()`: 74 lineas con los 6
 * tipos, sus `taskRef`, sus bindings y valores como `fragmentSetIdTemplate` — un estandar concreto
 * escrito dentro de una store generica del editor. El editor conserva el ENSAMBLADO (defaults del
 * provider, merge, orden y conectores del flujo); el QUE es de quien conoce el estandar.</p>
 *
 * <p>Los dos primeros pasos (FILE_READ -> DB_WRITE a `staging_record`) son del motor, pero forman
 * parte de ESTA plantilla: es el camino paginado que MT101 necesita para escalar. Otro vertical
 * armara el suyo.</p>
 */
export const SWIFT_MT101_MASSIVE_TEMPLATE: ProcessTemplateRegistration = {
  id: 'swift-mt101-masivo',
  labelKey: 'processes.template.swiftMt101Massive',
  tasks: [
    { taskType: 'FILE_READ', ref: 'leer-archivo', overrides: { executionMode: 'batch' } },
    {
      taskType: 'DB_WRITE',
      ref: 'staging',
      overrides: {
        executionMode: 'batch',
        mode: 'insert',
        targetTable: 'staging_record',
        jdbcBatchSize: 5000,
        input: { source: 'task-output', sourceTaskRef: 'leer-archivo', sourceOutput: 'records' },
      },
    },
    {
      taskType: 'MT101_BUILD_FROM_TABLE',
      ref: BUILD_REF,
      overrides: {
        executionMode: 'once',
        input: { source: 'task-output', sourceTaskRef: 'staging', sourceOutput: 'table' },
        fragmentSetIdTemplate: 'MT101-${_processExecutionId}',
        replaceExisting: true,
        maxTransactionsPerMessage: 100,
        maxBytesPerMessage: 10000,
      },
    },
    {
      taskType: 'MT101_VALIDATE',
      ref: 'validar',
      overrides: {
        executionMode: 'once',
        input: FRAGMENTS_INPUT,
        pageSize: 200,
        publishIssuesTo: 'table:mt101_validation_issue',
        maxIssuesInOutput: 1000,
      },
    },
    {
      taskType: 'MT101_ARCHIVE',
      ref: 'archivar',
      overrides: { executionMode: 'once', input: FRAGMENTS_INPUT, pageSize: 200, maxRecordsInOutput: 1000 },
    },
    {
      taskType: 'MT101_PAY',
      ref: 'pagar',
      overrides: { executionMode: 'once', input: FRAGMENTS_INPUT, pageSize: 200, maxRecordsInOutput: 1000 },
    },
  ],
};

export function provideSwiftMt101ProcessTemplate(): Provider[] {
  return [provideProcessTemplate(SWIFT_MT101_MASSIVE_TEMPLATE)];
}
