import { describe, expect, it } from 'vitest';
import { DbExecuteStoredProcedureTaskProvider } from './db-execute-stored-procedure-task.provider';
import { DbExecuteFunctionTaskProvider } from './db-execute-function-task.provider';
import { DbWriteTaskProvider } from './db-write-task.provider';

/**
 * Lockea el contrato calificado de binding del motor (ADR-004):
 * - P1.a: SP/FN califican `taskRef.output.campo` SOLO outputs agregados (summary/out); los flujos
 *   por registro (records/table/errors/campo) van planos (`value`).
 * - P1.b: DB_WRITE persiste la clave de resolucion (calificada para summary/out/table) en
 *   columnMappings y el origen en columnSources, con round-trip de kind en hydrate.
 */
describe('DB task binding serialization (motor ADR-004)', () => {
  const inputFrom = (sourceTaskRef: string) => ({
    source: 'task-output' as const,
    sourceTaskRef,
    sourceOutput: 'records' as const,
  });

  describe('Stored procedure / function parameter qualification (P1.a)', () => {
    const cases = [
      { name: 'SP', provider: () => new DbExecuteStoredProcedureTaskProvider() },
      { name: 'FN', provider: () => new DbExecuteFunctionTaskProvider() },
    ];

    for (const { name, provider } of cases) {
      it(`${name}: aggregate (summary) binding is qualified without a flat value`, () => {
        const p = provider();
        const draft: any = {
          ...p.createDraft(),
          input: inputFrom('task-2'),
          parameters: [
            { name: 'p_total', jdbcType: 'INTEGER', direction: 'IN', sourceKind: 'summary', sourceKey: 'processedCount', sourceLabel: 'processedCount', expression: '' },
          ],
        };

        const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
        const param = config.parameters[0];

        expect(param.sourceTaskRef).toBe('task-2');
        expect(param.sourceOutput).toBe('summary');
        expect(param.sourceKind).toBe('summary');
        expect(param.sourceKey).toBe('processedCount');
        // Sin `value`: el backend construye `task-2.summary.processedCount` desde sourceTaskRef/Output.
        expect(param.value).toBeUndefined();
      });

      it(`${name}: per-record (table) binding stays plain via value`, () => {
        const p = provider();
        const draft: any = {
          ...p.createDraft(),
          input: inputFrom('task-2'),
          parameters: [
            { name: 'p_id', jdbcType: 'INTEGER', direction: 'IN', sourceKind: 'table', sourceKey: 'id', sourceLabel: 'id', expression: '' },
          ],
        };

        const param = JSON.parse(p.toTaskPatch(draft).configurationJson as string).parameters[0];

        expect(param.value).toBe('id');
        expect(param.sourceTaskRef).toBeUndefined();
        expect(param.sourceOutput).toBeUndefined();
      });
    }
  });

  describe('DB_WRITE column origin (P1.b)', () => {
    it('serializes an aggregate column as a qualified resolution key + columnSources origin', () => {
      const provider = new DbWriteTaskProvider();
      const draft: any = {
        ...provider.createDraft(),
        targetTable: 'destino',
        input: inputFrom('task-1'),
        mappings: [
          { targetColumn: 'cliente_id', sourceKind: 'field', sourceKey: 'id', sourceLabel: 'id', expression: '', key: false },
          { targetColumn: 'total_prev', sourceKind: 'summary', sourceKey: 'processedCount', sourceLabel: 'processedCount', expression: '', key: false },
        ],
      };

      const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);

      // Campo del registro: clave plana.
      expect(config.columnMappings.cliente_id).toBe('id');
      // Agregado: clave calificada para resolver sin colision desde el registro enriquecido.
      expect(config.columnMappings.total_prev).toBe('task-1.summary.processedCount');
      expect(config.columnSources.total_prev).toEqual({
        kind: 'summary',
        key: 'processedCount',
        taskRef: 'task-1',
        output: 'summary',
      });
      expect(config.columnSources.cliente_id).toEqual({ kind: 'field', key: 'id' });
    });

    it('round-trips kind via columnSources on hydrate', () => {
      const provider = new DbWriteTaskProvider();
      const task: any = {
        taskType: 'DB_WRITE',
        taskOrder: 2,
        configurationJson: JSON.stringify({
          taskRef: 'task-2',
          executionMode: 'batch',
          targetTable: 'destino',
          columnMappings: { cliente_id: 'id', total_prev: 'task-1.summary.processedCount' },
          columnSources: {
            cliente_id: { kind: 'field', key: 'id' },
            total_prev: { kind: 'summary', key: 'processedCount', taskRef: 'task-1', output: 'summary' },
          },
        }),
      };

      const draft = provider.hydrateDraft(task);
      const byColumn = new Map(draft.mappings.map((m) => [m.targetColumn, m]));

      expect(byColumn.get('cliente_id')?.sourceKind).toBe('field');
      expect(byColumn.get('cliente_id')?.sourceKey).toBe('id');
      // El kind original se restaura desde columnSources (no se aplana a 'field').
      expect(byColumn.get('total_prev')?.sourceKind).toBe('summary');
      expect(byColumn.get('total_prev')?.sourceKey).toBe('processedCount');
    });

    it('hydrates legacy configs (no columnSources) as field mappings', () => {
      const provider = new DbWriteTaskProvider();
      const task: any = {
        taskType: 'DB_WRITE',
        taskOrder: 2,
        configurationJson: JSON.stringify({
          taskRef: 'task-2',
          executionMode: 'batch',
          targetTable: 'destino',
          columnMappings: { cliente_id: 'id' },
        }),
      };

      const draft = provider.hydrateDraft(task);
      const row = draft.mappings.find((m) => m.targetColumn === 'cliente_id');

      expect(row?.sourceKind).toBe('field');
      expect(row?.sourceKey).toBe('id');
    });
  });

  // Despacho async (ADR-015): campos runtime compartidos en la base ProcessTaskProvider.
  describe('async dispatch serialization (ADR-015)', () => {
    const modelFor = (configurationJson: string): any => ({
      clientId: 'c1',
      taskOrder: 1,
      taskType: 'DB_WRITE',
      configurationJson,
    });

    it('round-trips async / asyncTransport / continueOnFailure', () => {
      const p = new DbWriteTaskProvider();
      const draft: any = { ...p.createDraft(), taskRef: 'task-1', async: true, asyncTransport: 'RABBITMQ', continueOnFailure: true };

      const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
      expect(config.async).toBe(true);
      expect(config.asyncTransport).toBe('RABBITMQ');
      expect(config.continueOnFailure).toBe(true);

      const rehydrated: any = p.hydrateDraft(modelFor(JSON.stringify(config)));
      expect(rehydrated.async).toBe(true);
      expect(rehydrated.asyncTransport).toBe('RABBITMQ');
      expect(rehydrated.continueOnFailure).toBe(true);
    });

    it('omits async keys when sync (config queda limpia, sin colisionar con transport de dominio)', () => {
      const p = new DbWriteTaskProvider();
      const config = JSON.parse(p.toTaskPatch({ ...p.createDraft(), taskRef: 'task-1' } as any).configurationJson as string);

      expect(config.async).toBeUndefined();
      expect(config.asyncTransport).toBeUndefined();
      expect(config.continueOnFailure).toBeUndefined();
      expect(config.transport).toBeUndefined();
    });

    it('persists continueOnFailure on a SYNC task (es politica general, no async)', () => {
      const p = new DbWriteTaskProvider();
      const config = JSON.parse(
        p.toTaskPatch({ ...p.createDraft(), taskRef: 'task-1', continueOnFailure: true } as any).configurationJson as string,
      );

      expect(config.continueOnFailure).toBe(true); // sin async: el motor sincrono la lee igual
      expect(config.async).toBeUndefined();
    });
  });
});
