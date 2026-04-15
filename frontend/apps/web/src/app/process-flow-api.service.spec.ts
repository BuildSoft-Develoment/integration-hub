import { TestBed } from '@angular/core/testing';
import { ProcessFlowApiService } from '../../../../libs/features/processes/src/lib/process-flow-api.service';
import { ProcessFlowMapper } from '../../../../libs/features/processes/src/lib/process-flow.mapper';
import { createTaskForm } from '../../../../libs/features/processes/src/lib/process.models';

describe('ProcessFlowApiService', () => {
  it('should expose a designer-friendly model with connector ids', () => {
    TestBed.configureTestingModule({
      providers: [ProcessFlowApiService],
    });

    const service = TestBed.inject(ProcessFlowApiService);
    const mapper = new ProcessFlowMapper();
    const first = createTaskForm('FILE_READ', 1);
    const second = createTaskForm('DB_WRITE', 2);
    const layout = mapper.createLayout([first, second]);

    const model = service.toDesignerModel(layout);

    expect(model.nodes[first.clientId]).toEqual(
      expect.objectContaining({
        id: first.clientId,
        taskRef: first.clientId,
        type: 'FILE_READ',
        size: { width: 220, height: 120 },
      })
    );
    expect(model.connections[`edge-${first.clientId}-${second.clientId}`]).toEqual({
      id: `edge-${first.clientId}-${second.clientId}`,
      source: `${first.clientId}-out`,
      target: `${second.clientId}-in`,
    });
  });

  it('should mirror select all into the designer selection model', () => {
    TestBed.configureTestingModule({
      providers: [ProcessFlowApiService],
    });

    const service = TestBed.inject(ProcessFlowApiService);
    const mapper = new ProcessFlowMapper();
    const first = createTaskForm('FILE_READ', 1);
    const second = createTaskForm('DB_WRITE', 2);
    const layout = mapper.createLayout([first, second]);

    service.setModelFromLayout(layout);
    const selection = service.selectAll(layout);

    expect(selection.nodes).toEqual([first.clientId, second.clientId]);
    expect(selection.connections).toEqual([`edge-${first.clientId}-${second.clientId}`]);
    expect(service.model?.selection).toEqual(selection);
  });

  it('should clear selection after removing selected nodes', () => {
    TestBed.configureTestingModule({
      providers: [ProcessFlowApiService],
    });

    const service = TestBed.inject(ProcessFlowApiService);
    const mapper = new ProcessFlowMapper();
    const first = createTaskForm('FILE_READ', 1);
    const second = createTaskForm('DB_WRITE', 2);
    const layout = mapper.createLayout([first, second]);

    service.setModelFromLayout(layout);
    service.updateSelection([first.clientId], []);

    const next = service.removeSelected(layout, [first, second]);

    expect(next.tasks).toHaveLength(1);
    expect(next.tasks[0].clientId).toBe(second.clientId);
    expect(service.model?.selection).toEqual({ nodes: [], connections: [] });
  });

  it('should restore deleted tasks on undo', () => {
    TestBed.configureTestingModule({
      providers: [ProcessFlowApiService],
    });

    const service = TestBed.inject(ProcessFlowApiService);
    const mapper = new ProcessFlowMapper();
    const first = createTaskForm('FILE_READ', 1);
    const second = createTaskForm('DB_WRITE', 2);
    const layout = mapper.createLayout([first, second]);

    service.setModelFromLayout(layout);
    service.updateSelection([first.clientId], []);

    const removed = service.removeSelected(layout, [first, second]);
    const restored = service.undo(removed.layout, removed.tasks);

    expect(removed.tasks).toHaveLength(1);
    expect(restored.tasks).toHaveLength(2);
    expect(restored.tasks.map((task) => task.clientId)).toEqual([first.clientId, second.clientId]);
    expect(restored.layout.nodes.map((node) => node.id)).toEqual([first.clientId, second.clientId]);
    expect(restored.layout.nodes.every((node) => node.size?.width === 220 && node.size?.height === 120)).toBe(true);
  });

  it('should undo node moves as a single drag operation', () => {
    TestBed.configureTestingModule({
      providers: [ProcessFlowApiService],
    });

    const service = TestBed.inject(ProcessFlowApiService);
    const mapper = new ProcessFlowMapper();
    const first = createTaskForm('FILE_READ', 1);
    const second = createTaskForm('DB_WRITE', 2);
    const layout = mapper.createLayout([first, second]);

    service.setModelFromLayout(layout);
    const moved = service.moveNodes(layout, {
      fNodes: [{ id: first.clientId, position: { x: 500, y: 240 } }],
    } as any);
    const restored = service.undo(moved, [first, second]);

    expect(moved.nodes.find((node) => node.id === first.clientId)?.position).toEqual({ x: 500, y: 240 });
    expect(restored.layout.nodes.find((node) => node.id === first.clientId)?.position).toEqual(
      layout.nodes.find((node) => node.id === first.clientId)?.position
    );
  });

  it('should undo a task created from the palette', () => {
    TestBed.configureTestingModule({
      providers: [ProcessFlowApiService],
    });

    const service = TestBed.inject(ProcessFlowApiService);
    const mapper = new ProcessFlowMapper();
    const first = createTaskForm('FILE_READ', 1);
    const layout = mapper.createLayout([first]);
    const second = createTaskForm('DB_WRITE', 2);

    service.setModelFromLayout(layout);
    const created = service.addTaskNode(layout, second, 2, { x: 420, y: 120 }, [first]);
    const restored = service.undo(created, [first, second]);

    expect(created.nodes).toHaveLength(2);
    expect(restored.layout.nodes).toHaveLength(1);
    expect(restored.tasks).toHaveLength(1);
    expect(restored.tasks[0].clientId).toBe(first.clientId);
  });
});
