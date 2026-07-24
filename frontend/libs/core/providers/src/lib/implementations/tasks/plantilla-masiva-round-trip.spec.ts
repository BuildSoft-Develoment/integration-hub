import { describe, expect, it } from 'vitest';
import { Mt101BuildFromTableTaskProvider } from './payments/swift/mt101-build-from-table-task.provider';
import { Mt101ValidateTaskProvider } from './payments/swift/mt101-validate-task.provider';
import { Mt101ArchiveTaskProvider } from './payments/swift/mt101-archive-task.provider';
import { Mt101PayTaskProvider } from './payments/swift/mt101-pay-task.provider';
import { DbWriteTaskProvider } from './db/db-write-task.provider';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

/**
 * Guarda de regresion sobre la PLANTILLA "MT101 masivo desde archivo"
 * ({@code ProcessEditorStore.applyMassiveMt101Template}). No es un caso hipotetico: es la config que el
 * producto siembra para todo proceso masivo, asi que cualquier clave que el round-trip del formulario pierda,
 * la pierde el camino por defecto en cuanto alguien abre la tarea y guarda.
 *
 * <p>El diagnostico que origino este test reporto dos: {@code maxTransactionsPerMessage: 100 -> 999} (el limite
 * de transacciones por mensaje MT101 se REESCRIBIA, porque el form lo hidrataba de {@code splitBy} y el backend
 * lo lee del nivel superior) y {@code maxRecordsInOutput} borrado.</p>
 */
const fragmentsInput = { source: 'task-output', sourceTaskRef: 'build-mt101-masivo', sourceOutput: 'fragments' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PLANTILLA: Array<{ tipo: string; p: any; config: Record<string, unknown> }> = [
  { tipo: 'DB_WRITE', p: new DbWriteTaskProvider(), config: {
      taskRef: 'staging', executionMode: 'batch', mode: 'insert', targetTable: 'staging_record',
      jdbcBatchSize: 5000,
      input: { source: 'task-output', sourceTaskRef: 'leer-archivo', sourceOutput: 'records' } } },
  { tipo: 'MT101_BUILD_FROM_TABLE', p: new Mt101BuildFromTableTaskProvider(), config: {
      taskRef: 'build-mt101-masivo', executionMode: 'once',
      input: { source: 'task-output', sourceTaskRef: 'staging', sourceOutput: 'table' },
      fragmentSetIdTemplate: 'MT101-${_processExecutionId}', replaceExisting: true,
      maxTransactionsPerMessage: 100, maxBytesPerMessage: 10000 } },
  { tipo: 'MT101_VALIDATE', p: new Mt101ValidateTaskProvider(), config: {
      taskRef: 'validar', executionMode: 'once', input: fragmentsInput, pageSize: 200,
      publishIssuesTo: 'table:mt101_validation_issue', maxIssuesInOutput: 1000 } },
  { tipo: 'MT101_ARCHIVE', p: new Mt101ArchiveTaskProvider(), config: {
      taskRef: 'archivar', executionMode: 'once', input: fragmentsInput, pageSize: 200,
      maxRecordsInOutput: 1000 } },
  { tipo: 'MT101_PAY', p: new Mt101PayTaskProvider(), config: {
      taskRef: 'pagar', executionMode: 'once', input: fragmentsInput, pageSize: 200,
      maxRecordsInOutput: 1000 } },
];

describe('Plantilla MT101 masiva — round-trip por el formulario', () => {
  for (const { tipo, p, config } of PLANTILLA) {
    it(`${tipo} conserva toda la config sembrada por la plantilla`, () => {
      const task: ProcessTaskFormModel = {
        clientId: 'c', id: null, taskOrder: 1, taskType: tipo, active: true,
        sourceDefinitionId: null, readerDefinitionId: null, configurationJson: JSON.stringify(config),
      };

      const saved = JSON.parse(p.toTaskPatch(p.hydrateDraft(task)).configurationJson as string);

      for (const clave of Object.keys(config)) {
        expect(saved[clave], `${tipo}.${clave} cambio al guardar`).toEqual(config[clave]);
      }
    });
  }
});
