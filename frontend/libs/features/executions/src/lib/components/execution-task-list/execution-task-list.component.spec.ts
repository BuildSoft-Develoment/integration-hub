import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  ExecutionProgress,
  ProcessTaskExecutionRecord,
} from '../../models/execution.models';
import { ExecutionTaskListComponent } from './execution-task-list.component';

function task(taskDefinitionId: number, over: Partial<ProcessTaskExecutionRecord> = {}): ProcessTaskExecutionRecord {
  return {
    id: taskDefinitionId * 10,
    processExecutionId: 1,
    taskDefinitionId,
    taskOrder: taskDefinitionId,
    taskType: 'DB_WRITE',
    status: 'RUNNING',
    executedAt: null,
    startedAt: null,
    finishedAt: null,
    details: null,
    payloadJson: null,
    processedFiles: [],
    ...over,
  };
}

function progress(over: Partial<ExecutionProgress> = {}): ExecutionProgress {
  return {
    executionId: 1,
    scatterTasks: [],
    syncTasks: [],
    pipeline: { outboxDead: 0, inboxDead: 0, inboxPoison: 0 },
    ...over,
  };
}

describe('ExecutionTaskListComponent (correlación de progreso)', () => {
  function build(tasks: ProcessTaskExecutionRecord[], prog: ExecutionProgress | null) {
    const fixture = TestBed.createComponent(ExecutionTaskListComponent);
    fixture.componentRef.setInput('tasks', tasks);
    fixture.componentRef.setInput('progress', prog);
    return fixture.componentInstance;
  }

  it('correlaciona el progreso scatter por taskDefinitionId', () => {
    const c = build(
      [task(1), task(2)],
      progress({
        scatterTasks: [
          { taskDefinitionId: 2, completed: 3, failed: 0, total: 4, streaming: false, percent: 75, status: 'RUNNING', lastProgressAt: null },
        ],
      })
    );
    expect(c.scatterFor(task(1))).toBeNull();
    expect(c.scatterFor(task(2))?.percent).toBe(75);
    expect(c.syncFor(task(2))).toBeNull();
  });

  it('correlaciona el progreso sync por taskDefinitionId', () => {
    const c = build(
      [task(5)],
      progress({ syncTasks: [{ taskDefinitionId: 5, recordsProcessed: 420000 }] })
    );
    expect(c.syncFor(task(5))?.recordsProcessed).toBe(420000);
    expect(c.scatterFor(task(5))).toBeNull();
  });

  it('respeta el streaming indeterminado (percent null)', () => {
    const c = build(
      [task(7)],
      progress({
        scatterTasks: [
          { taskDefinitionId: 7, completed: 12, failed: 0, total: null, streaming: true, percent: null, status: 'RUNNING', lastProgressAt: null },
        ],
      })
    );
    const sc = c.scatterFor(task(7));
    expect(sc?.streaming).toBe(true);
    expect(sc?.percent).toBeNull();
  });

  it('expone la salud del pipeline y su conteo de muertas', () => {
    const c = build([task(1)], progress({ pipeline: { outboxDead: 1, inboxDead: 0, inboxPoison: 2 } }));
    expect(c.pipeline()).not.toBeNull();
    expect(c.pipelineDeadCount()).toBe(3);
  });

  it('sin progreso, no correlaciona ni reporta pipeline', () => {
    const c = build([task(1)], null);
    expect(c.scatterFor(task(1))).toBeNull();
    expect(c.syncFor(task(1))).toBeNull();
    expect(c.pipeline()).toBeNull();
    expect(c.pipelineDeadCount()).toBe(0);
  });

  // Render real del template (detectChanges): confirma que las barras/etiquetas de progreso se pintan
  // desde el input — la "última milla" que el e2e no pudo validar por la inestabilidad del entorno.
  describe('render del template', () => {
    function render(tasks: ProcessTaskExecutionRecord[], prog: ExecutionProgress | null) {
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const fixture = TestBed.createComponent(ExecutionTaskListComponent);
      fixture.componentRef.setInput('tasks', tasks);
      fixture.componentRef.setInput('progress', prog);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }

    it('pinta la barra determinada y la etiqueta % del scatter materializado', () => {
      const el = render(
        [task(1, { taskType: 'REST_CALL' })],
        progress({
          scatterTasks: [
            { taskDefinitionId: 1, completed: 3, failed: 0, total: 4, streaming: false, percent: 75, status: 'RUNNING', lastProgressAt: null },
          ],
        })
      );
      expect(el.textContent).toContain('75%');
      expect(el.querySelector('mat-progress-bar[mode="determinate"]')).not.toBeNull();
    });

    it('pinta la barra indeterminada del scatter en streaming (sin % falso)', () => {
      const el = render(
        [task(1)],
        progress({
          scatterTasks: [
            { taskDefinitionId: 1, completed: 12, failed: 0, total: null, streaming: true, percent: null, status: 'RUNNING', lastProgressAt: null },
          ],
        })
      );
      expect(el.querySelector('mat-progress-bar[mode="indeterminate"]')).not.toBeNull();
      expect(el.textContent).not.toContain('%');
    });

    it('pinta el contador del sync y el chip de salud del pipeline', () => {
      const el = render(
        [task(2)],
        progress({
          syncTasks: [{ taskDefinitionId: 2, recordsProcessed: 420000 }],
          pipeline: { outboxDead: 0, inboxDead: 0, inboxPoison: 0 },
        })
      );
      expect(el.textContent).toContain('420000');
      // chip de salud (fuera del acordeón) presente cuando hay progreso cargado
      expect(el.querySelector('.task-pipeline')).not.toBeNull();
    });
  });
});
