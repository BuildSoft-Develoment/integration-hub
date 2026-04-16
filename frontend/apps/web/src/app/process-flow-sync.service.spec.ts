import { TestBed } from '@angular/core/testing';

import { ProcessFlowMapper } from '../../../../libs/features/processes/src/lib/process-flow.mapper';
import { ProcessFlowSyncService } from '../../../../libs/features/processes/src/lib/process-flow-sync.service';
import { createTaskForm } from '../../../../libs/features/processes/src/lib/process.models';

describe('ProcessFlowSyncService', () => {
  let mapper: ProcessFlowMapper;
  let sync: ProcessFlowSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProcessFlowMapper, ProcessFlowSyncService],
    });

    mapper = TestBed.inject(ProcessFlowMapper);
    sync = TestBed.inject(ProcessFlowSyncService);
  });

  it('should reorder tasks based on the connected flow', () => {
    const first = createTaskForm('FILE_READ', 1);
    const second = createTaskForm('DB_WRITE', 2);
    const third = createTaskForm('NOTIFICATION', 3);
    const layout = mapper.createLayout([first, second, third]);

    const connectedLayout = sync.createConnection(
      sync.createConnection(
        {
          ...layout,
          edges: [],
        },
        `${second.clientId}-out`,
        `${third.clientId}-in`
      ),
      `${first.clientId}-out`,
      `${second.clientId}-in`
    );

    const orderedTasks = sync.synchronizeTasks(connectedLayout, [first, second, third]);

    expect(orderedTasks.map((task) => task.clientId)).toEqual([
      first.clientId,
      second.clientId,
      third.clientId,
    ]);
    expect(orderedTasks.map((task) => task.taskOrder)).toEqual([1, 2, 3]);
  });

  it('should keep only one outgoing and one incoming connection per node', () => {
    const first = createTaskForm('FILE_READ', 1);
    const second = createTaskForm('DB_WRITE', 2);
    const third = createTaskForm('REST_CALL', 3);
    const layout = mapper.createLayout([first, second, third]);

    const nextLayout = sync.createConnection(layout, `${first.clientId}-out`, `${third.clientId}-in`);

    expect(nextLayout.edges).toEqual([
      {
        id: `edge-${first.clientId}-${third.clientId}`,
        source: first.clientId,
        target: third.clientId,
      },
    ]);
  });

  it('should preserve node positions and connectors when task client ids change after reload', () => {
    const first = createTaskForm('FILE_READ', 1);
    const second = createTaskForm('DB_WRITE', 2);
    const layout = mapper.createLayout([first, second]);

    const persistedLikeLayout = {
      ...layout,
      nodes: [
        {
          ...layout.nodes[0],
          position: { x: 140, y: 180 },
          taskOrder: 1,
        },
        {
          ...layout.nodes[1],
          position: { x: 520, y: 240 },
          taskOrder: 2,
        },
      ],
      edges: [
        {
          id: `edge-${first.clientId}-${second.clientId}`,
          source: first.clientId,
          target: second.clientId,
        },
      ],
    };

    const reloadedTasks = [
      { ...first, clientId: 'task-101', taskOrder: 1 },
      { ...second, clientId: 'task-102', taskOrder: 2 },
    ];

    const synchronized = sync.synchronizeLayout(persistedLikeLayout, reloadedTasks);

    expect(synchronized.nodes.map((node) => node.id)).toEqual(['task-101', 'task-102']);
    expect(synchronized.nodes.map((node) => node.position)).toEqual([
      { x: 140, y: 180 },
      { x: 520, y: 240 },
    ]);
    expect(synchronized.edges).toEqual([
      {
        id: 'edge-task-101-task-102',
        source: 'task-101',
        target: 'task-102',
      },
    ]);
  });

  it('should reconcile old saved designer layouts without taskOrder using graph order', () => {
    const first = createTaskForm('FILE_READ', 1);
    const second = createTaskForm('DB_WRITE', 2);
    const third = createTaskForm('DB_EXECUTE_SP', 3);

    const oldSavedLayout = {
      version: 1,
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        { id: 'task-91', taskRef: 'task-91', type: 'FILE_READ' as const, position: { x: 131, y: 42 }, size: { width: 220, height: 120 } },
        { id: 'task-92', taskRef: 'task-92', type: 'DB_WRITE' as const, position: { x: 472, y: 81 }, size: { width: 220, height: 120 } },
        { id: 'task-93', taskRef: 'task-93', type: 'DB_EXECUTE_SP' as const, position: { x: 794, y: 123 }, size: { width: 220, height: 120 } },
      ],
      edges: [
        { id: 'edge-task-91-task-92', source: 'task-91', target: 'task-92' },
        { id: 'edge-task-92-task-93', source: 'task-92', target: 'task-93' },
      ],
    };

    const reloadedTasks = [
      { ...first, clientId: 'task-201', taskOrder: 1 },
      { ...second, clientId: 'task-202', taskOrder: 2 },
      { ...third, clientId: 'task-203', taskOrder: 3 },
    ];

    const synchronized = sync.synchronizeLayout(oldSavedLayout, reloadedTasks);

    expect(synchronized.nodes.map((node) => ({ id: node.id, position: node.position }))).toEqual([
      { id: 'task-201', position: { x: 131, y: 42 } },
      { id: 'task-202', position: { x: 472, y: 81 } },
      { id: 'task-203', position: { x: 794, y: 123 } },
    ]);
    expect(synchronized.edges).toEqual([
      { id: 'edge-task-201-task-202', source: 'task-201', target: 'task-202' },
      { id: 'edge-task-202-task-203', source: 'task-202', target: 'task-203' },
    ]);
  });
});
