import { Injectable } from '@angular/core';
import { FMoveNodesEvent } from '@foblex/flow';
import { DEFAULT_PROCESS_FLOW_NODE_SIZE, ProcessFlowLayout, ProcessFlowNodePosition, ProcessFlowNodeSize } from './process-flow.models';
import { ProcessFlowMapper } from './process-flow.mapper';
import { ProcessFlowSyncService } from './process-flow-sync.service';
import { ProcessTaskFormModel } from './process.models';

export interface ProcessFlowDesignerSelection {
  nodes: string[];
  connections: string[];
}

export interface ProcessFlowDesignerModel {
  nodes: Record<string, { id: string; taskRef: string; taskOrder?: number; type: ProcessTaskFormModel['taskType']; position: ProcessFlowNodePosition; size: ProcessFlowNodeSize }>;
  connections: Record<string, { id: string; source: string; target: string }>;
  selection?: ProcessFlowDesignerSelection;
  transform?: ProcessFlowLayout['viewport'];
}

interface ProcessFlowHistoryEntry {
  model: ProcessFlowDesignerModel;
  tasks?: ProcessTaskFormModel[];
}

@Injectable()
export class ProcessFlowApiService {
  private readonly mapper = new ProcessFlowMapper();
  private readonly sync = new ProcessFlowSyncService(this.mapper);
  private history: ProcessFlowHistoryEntry[] = [];
  private future: ProcessFlowHistoryEntry[] = [];
  public model: ProcessFlowDesignerModel | null = null;

  toDesignerModel(layout: ProcessFlowLayout): ProcessFlowDesignerModel {
    return {
      nodes: Object.fromEntries(
        layout.nodes.map((node) => [
          node.id,
          {
            id: node.id,
            taskRef: node.taskRef,
            taskOrder: node.taskOrder,
            type: node.type,
            position: node.position,
            size: node.size ?? { ...DEFAULT_PROCESS_FLOW_NODE_SIZE },
          },
        ])
      ),
      connections: Object.fromEntries(
        layout.edges.map((edge) => [
          edge.id,
          {
            id: edge.id,
            source: `${edge.source}-out`,
            target: `${edge.target}-in`,
          },
        ])
      ),
      transform: layout.viewport,
    };
  }

  setModelFromLayout(layout: ProcessFlowLayout): ProcessFlowDesignerModel {
    const model = this.toDesignerModel(layout);
    this.model = model;
    return model;
  }

  toFlowLayout(model: ProcessFlowDesignerModel): ProcessFlowLayout {
    return {
      version: 1,
      viewport: model.transform ?? { x: 0, y: 0, zoom: 1 },
      nodes: Object.values(model.nodes).map((node) => ({
        id: node.id,
        taskRef: node.taskRef,
        taskOrder: node.taskOrder,
        type: node.type,
        position: node.position,
        size: node.size ?? { ...DEFAULT_PROCESS_FLOW_NODE_SIZE },
      })),
      edges: Object.values(model.connections).map((connection) => ({
        id: connection.id,
        source: connection.source.replace(/-out$/, ''),
        target: connection.target.replace(/-in$/, ''),
      })),
    };
  }

  moveNode(layout: ProcessFlowLayout, nodeId: string, position: ProcessFlowNodePosition): ProcessFlowLayout {
    this.pushHistory();
    const nextLayout = {
      ...layout,
      nodes: layout.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              position,
            }
          : node
      ),
    };
    this.setModelFromLayout(nextLayout);
    return nextLayout;
  }

  moveNodes(layout: ProcessFlowLayout, event: FMoveNodesEvent): ProcessFlowLayout {
    this.pushHistory();
    const positions = new Map(
      event.fNodes.map((node) => [node.id, { x: node.position.x, y: node.position.y }])
    );
    const nextLayout: ProcessFlowLayout = {
      ...layout,
      nodes: layout.nodes.map((node) =>
        positions.has(node.id)
          ? {
              ...node,
              position: positions.get(node.id)!,
            }
          : node
      ),
    };
    this.setModelFromLayout(nextLayout);
    return nextLayout;
  }

  addTaskNode(
    layout: ProcessFlowLayout,
    task: ProcessTaskFormModel,
    taskCount: number,
    position?: ProcessFlowNodePosition,
    tasksSnapshot?: readonly ProcessTaskFormModel[]
  ): ProcessFlowLayout {
    this.pushHistory(tasksSnapshot);
    const nextLayout = this.sync.addTask(layout, task, taskCount, position);
    this.setModelFromLayout(nextLayout);
    return nextLayout;
  }

  createConnection(layout: ProcessFlowLayout, sourceId: string, targetId: string | undefined): ProcessFlowLayout {
    this.pushHistory();
    const nextLayout = this.sync.createConnection(layout, sourceId, targetId);
    this.setModelFromLayout(nextLayout);
    return nextLayout;
  }

  reassignConnection(
    layout: ProcessFlowLayout,
    connectionId: string,
    nextSourceId: string | undefined,
    nextTargetId: string | undefined,
    previousSourceId: string,
    previousTargetId: string
  ): ProcessFlowLayout {
    this.pushHistory();
    const nextLayout = this.sync.reassignConnection(
      layout,
      connectionId,
      nextSourceId,
      nextTargetId,
      previousSourceId,
      previousTargetId
    );
    this.setModelFromLayout(nextLayout);
    return nextLayout;
  }

  synchronizeLayout(layout: ProcessFlowLayout, tasks: readonly ProcessTaskFormModel[]): ProcessFlowLayout {
    const nextLayout = this.sync.synchronizeLayout(layout, tasks);
    this.setModelFromLayout(nextLayout);
    return nextLayout;
  }

  synchronizeTasks(layout: ProcessFlowLayout, tasks: readonly ProcessTaskFormModel[]): ProcessTaskFormModel[] {
    return this.sync.synchronizeTasks(layout, tasks);
  }

  serialize(layout: ProcessFlowLayout): string {
    this.setModelFromLayout(layout);
    return JSON.stringify(this.model ?? this.toDesignerModel(layout), null, 2);
  }

  updateSelection(nodeIds: string[], connectionIds: string[]): void {
    if (!this.model) {
      return;
    }
    this.model = {
      ...this.model,
      selection: {
        nodes: [...nodeIds],
        connections: [...connectionIds],
      },
    };
  }

  selectAll(layout: ProcessFlowLayout): ProcessFlowDesignerSelection {
    const selection: ProcessFlowDesignerSelection = {
      nodes: layout.nodes.map((node) => node.id),
      connections: layout.edges.map((edge) => edge.id),
    };
    if (this.model) {
      this.model = {
        ...this.model,
        selection,
      };
    }
    return selection;
  }

  updateTransform(position: { x: number; y: number }, zoom: number): void {
    if (!this.model) {
      return;
    }
    this.model = {
      ...this.model,
      transform: {
        x: position.x,
        y: position.y,
        zoom,
      },
    };
  }

  removeSelected(layout: ProcessFlowLayout, tasks: readonly ProcessTaskFormModel[]): { layout: ProcessFlowLayout; tasks: ProcessTaskFormModel[] } {
    if (!this.model?.selection) {
      return { layout, tasks: [...tasks] };
    }
    this.pushHistory(tasks);
    const nodeIds = new Set(this.model.selection.nodes);
    const connectionIds = new Set(this.model.selection.connections);
    const nextLayout: ProcessFlowLayout = {
      ...layout,
      nodes: layout.nodes.filter((node) => !nodeIds.has(node.id)),
      edges: layout.edges.filter(
        (edge) =>
          !connectionIds.has(edge.id) &&
          !nodeIds.has(edge.source) &&
          !nodeIds.has(edge.target)
      ),
    };
    const nextTasks = tasks.filter((task) => !nodeIds.has(task.clientId));
    const synchronized = this.sync.synchronizeLayout(nextLayout, nextTasks);
    const orderedTasks = this.sync.synchronizeTasks(synchronized, nextTasks);
    this.setModelFromLayout(synchronized);
    this.updateSelection([], []);
    return { layout: synchronized, tasks: orderedTasks };
  }

  removeConnection(
    layout: ProcessFlowLayout,
    tasks: readonly ProcessTaskFormModel[],
    connectionId: string
  ): { layout: ProcessFlowLayout; tasks: ProcessTaskFormModel[] } {
    this.pushHistory(tasks);
    const nextLayout: ProcessFlowLayout = {
      ...layout,
      edges: layout.edges.filter((edge) => edge.id !== connectionId),
    };
    const synchronized = this.sync.synchronizeLayout(nextLayout, tasks);
    const orderedTasks = this.sync.synchronizeTasks(synchronized, tasks);
    this.setModelFromLayout(synchronized);
    this.updateSelection([], []);
    return { layout: synchronized, tasks: orderedTasks };
  }

  undo(
    layoutFallback: ProcessFlowLayout,
    tasksFallback: readonly ProcessTaskFormModel[]
  ): { layout: ProcessFlowLayout; tasks: ProcessTaskFormModel[] } {
    const previous = this.history.pop();
    if (!previous) {
      return { layout: layoutFallback, tasks: [...tasksFallback] };
    }
    if (this.model) {
      this.future.push({
        model: JSON.parse(JSON.stringify(this.model)) as ProcessFlowDesignerModel,
        tasks: [...tasksFallback],
      });
    }
    this.model = previous.model;
    const layout = this.toFlowLayout(previous.model);
    const tasks = previous.tasks ? normalizeTasks(previous.tasks) : this.sync.synchronizeTasks(layout, tasksFallback);
    return { layout, tasks };
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  redo(
    layoutFallback: ProcessFlowLayout,
    tasksFallback: readonly ProcessTaskFormModel[]
  ): { layout: ProcessFlowLayout; tasks: ProcessTaskFormModel[] } {
    const next = this.future.pop();
    if (!next) {
      return { layout: layoutFallback, tasks: [...tasksFallback] };
    }
    if (this.model) {
      this.history.push({
        model: JSON.parse(JSON.stringify(this.model)) as ProcessFlowDesignerModel,
        tasks: [...tasksFallback],
      });
    }
    this.model = next.model;
    const layout = this.toFlowLayout(next.model);
    const tasks = next.tasks ? normalizeTasks(next.tasks) : this.sync.synchronizeTasks(layout, tasksFallback);
    return { layout, tasks };
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  private pushHistory(tasks?: readonly ProcessTaskFormModel[]): void {
    if (this.model) {
      this.history.push({
        model: JSON.parse(JSON.stringify(this.model)) as ProcessFlowDesignerModel,
        tasks: tasks ? normalizeTasks(tasks) : undefined,
      });
      if (this.history.length > 30) {
        this.history.shift();
      }
    }
    this.future = [];
  }
}

function normalizeTasks(tasks: readonly ProcessTaskFormModel[]): ProcessTaskFormModel[] {
  return JSON.parse(JSON.stringify(tasks)) as ProcessTaskFormModel[];
}
