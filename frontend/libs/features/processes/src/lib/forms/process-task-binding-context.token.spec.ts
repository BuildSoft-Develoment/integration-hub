import { TestBed } from '@angular/core/testing';
import { ReaderManagerService, SourceManagerService } from '@integration-hub/core/services';
import { ProcessTaskBindingOption, ProcessTaskFormModel, SourceRef } from '@integration-hub/core/providers';
import { ProcessTaskBindingContextService } from './process-task-binding-context.service';

/**
 * Lockea tokenForOption (P1.c): los tokens insertados en plantillas (body/headers/message) se
 * califican `taskRef.output.campo` SOLO para outputs agregados (summary/table/out); records,
 * variable y metadata van planos (resuelven del registro actual o la metadata transversal).
 */
describe('ProcessTaskBindingContextService.tokenForOption (P1.c)', () => {
  let service: ProcessTaskBindingContextService;
  let sourceDraft: Record<string, unknown>;

  beforeEach(() => {
    sourceDraft = {};
    TestBed.configureTestingModule({
      providers: [
        ProcessTaskBindingContextService,
        { provide: ReaderManagerService, useValue: {} },
        { provide: SourceManagerService, useValue: { hydrateDraft: () => sourceDraft } },
      ],
    });
    service = TestBed.inject(ProcessTaskBindingContextService);
  });

  const option = (kind: ProcessTaskBindingOption['kind'], key: string): ProcessTaskBindingOption => ({
    key,
    label: key,
    kind,
    groupKey: 'g',
  });

  it('qualifies aggregate outputs (summary/table/out) with the producer taskRef', () => {
    expect(service.tokenForOption(option('summary', 'processedCount'), 'task-1')).toBe('task-1.summary.processedCount');
    expect(service.tokenForOption(option('table', 'cliente'), 'task-2')).toBe('task-2.table.cliente');
    expect(service.tokenForOption(option('out', 'resultado'), 'task-3')).toBe('task-3.out.resultado');
  });

  it('keeps per-record / transversal sources plain', () => {
    expect(service.tokenForOption(option('records', 'nombre'), 'task-1')).toBe('nombre');
    expect(service.tokenForOption(option('variable', 'fecha'), 'task-1')).toBe('fecha');
    expect(service.tokenForOption(option('metadata', '_processExecutionId'), 'task-1')).toBe('_processExecutionId');
    expect(service.tokenForOption(option('errors', 'message'), 'task-1')).toBe('message');
  });

  it('falls back to the plain key when there is no source taskRef', () => {
    expect(service.tokenForOption(option('summary', 'processedCount'), '')).toBe('processedCount');
  });

  it('treats MT101 tasks as record producers by default', () => {
    const task = taskForm('MT101_ARCHIVE');

    expect(service.availableOutputsForTask(task)).toContain('records');
    expect(service.defaultOutputForTask(task)).toBe('records');
  });

  it('exposes table columns when MT101_BUILD consumes a DB_WRITE table output', () => {
    const dbWrite: ProcessTaskFormModel = {
      ...taskForm('DB_WRITE'),
      clientId: 'db-write',
      taskOrder: 1,
      configurationJson: JSON.stringify({
        taskRef: 'persist-payments',
        targetTable: 'payments_outbox',
        columnMappings: {
          moneda: 'moneda',
          monto: 'monto',
          cuenta_beneficiario: 'cuenta',
        },
      }),
    };
    const build: ProcessTaskFormModel = {
      ...taskForm('MT101_BUILD'),
      clientId: 'build-mt101',
      taskOrder: 2,
      configurationJson: JSON.stringify({
        taskRef: 'build-mt101',
        input: {
          source: 'task-output',
          sourceTaskRef: 'persist-payments',
          sourceOutput: 'table',
        },
      }),
    };

    const options = service.buildOptions(build, [dbWrite, build], [], undefined);

    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'metadata', key: '_processExecutionId' }),
        expect.objectContaining({ kind: 'summary', key: 'processedCount' }),
        expect.objectContaining({ kind: 'table', key: 'moneda' }),
        expect.objectContaining({ kind: 'table', key: 'monto' }),
        expect.objectContaining({ kind: 'table', key: 'cuenta_beneficiario' }),
      ]),
    );
  });

  it('infers SWIFT_MT reader from source metadata and filename', () => {
    const source: SourceRef = {
      id: 1,
      name: 'swift-inbound',
      sourceType: 'FILESYSTEM',
      configurationJson: '{}',
    };

    sourceDraft = { mediaType: 'application/x-swift', fileNameTemplate: 'inbound-*.mt101' };

    expect(service.inferCompatibleReaders(source)).toContain('SWIFT_MT');
  });
});

function taskForm(taskType: ProcessTaskFormModel['taskType']): ProcessTaskFormModel {
  return {
    clientId: taskType.toLowerCase(),
    id: null,
    taskOrder: 1,
    taskType,
    active: true,
    sourceDefinitionId: null,
    readerDefinitionId: null,
    configurationJson: JSON.stringify({ taskRef: taskType.toLowerCase() }),
  };
}
