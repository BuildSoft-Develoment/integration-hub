import { inject, Injectable } from '@angular/core';
import { normalizeTaskOrders, ProcessTaskFormModel } from './process.models';
import { ProcessFlowLayout, ProcessFlowNodePosition, ProcessTaskFlowContext } from './process-flow.models';
import { ProcessFlowMapper } from './process-flow.mapper';

@Injectable({ providedIn: 'root' })
export class ProcessFlowSyncService {
  private readonly connectorSuffixPattern = /-(in|out)$/;
  private readonly mapper = inject(ProcessFlowMapper);

  initialize(context: ProcessTaskFlowContext): ProcessFlowLayout {
    const normalizedTasks = normalizeTaskOrders(context.tasks);
    const parsed = this.mapper.parseLayout(context.flowLayoutJson);
    if (!parsed) {
      return this.mapper.createLayout(normalizedTasks);
    }

    return this.synchronizeLayout(parsed, normalizedTasks);
  }

  addTask(layout: ProcessFlowLayout, task: ProcessTaskFormModel, taskCount: number, position?: ProcessFlowNodePosition): ProcessFlowLayout {
    const node = this.mapper.createNode(task, taskCount - 1, position);
    const nodes = [...layout.nodes, node];
    const existingEdges = this.normalizeEdges(nodes, layout.edges);
    const orderedIds = this.orderNodeIds({ ...layout, nodes, edges: existingEdges });
    const priorNodeIds = orderedIds.filter((id) => id !== node.id);
    const previousNodeId = priorNodeIds[priorNodeIds.length - 1];

    return {
      ...layout,
      nodes,
      edges: previousNodeId
        ? this.normalizeEdges(nodes, [
            ...existingEdges,
            { id: this.edgeId(previousNodeId, node.id), source: previousNodeId, target: node.id },
          ])
        : existingEdges,
    };
  }

  removeTask(layout: ProcessFlowLayout, clientId: string): ProcessFlowLayout {
    const nodes = layout.nodes.filter((node) => node.taskRef !== clientId);
    return {
      ...layout,
      nodes,
      edges: this.normalizeEdges(
        nodes,
        layout.edges.filter((edge) => edge.source !== clientId && edge.target !== clientId)
      ),
    };
  }

  updateTaskType(layout: ProcessFlowLayout, task: ProcessTaskFormModel): ProcessFlowLayout {
    return {
      ...layout,
      nodes: layout.nodes.map((node) =>
        node.taskRef === task.clientId
          ? {
              ...node,
              type: task.taskType,
            }
          : node
      ),
    };
  }

  createConnection(layout: ProcessFlowLayout, sourceConnectorId: string, targetConnectorId: string | undefined): ProcessFlowLayout {
    const source = this.toNodeId(sourceConnectorId);
    const target = this.toNodeId(targetConnectorId);
    if (!source || !target || source === target) {
      return layout;
    }

    return {
      ...layout,
      edges: this.normalizeEdges(layout.nodes, [
        ...layout.edges.filter((edge) => edge.source !== source && edge.target !== target),
        { id: this.edgeId(source, target), source, target },
      ]),
    };
  }

  reassignConnection(
    layout: ProcessFlowLayout,
    connectionId: string,
    nextSourceConnectorId: string | undefined,
    nextTargetConnectorId: string | undefined,
    previousSourceConnectorId: string,
    previousTargetConnectorId: string
  ): ProcessFlowLayout {
    const source = this.toNodeId(nextSourceConnectorId ?? previousSourceConnectorId);
    const target = this.toNodeId(nextTargetConnectorId ?? previousTargetConnectorId);
    if (!source || !target || source === target) {
      return {
        ...layout,
        edges: layout.edges.filter((edge) => edge.id !== connectionId),
      };
    }

    return {
      ...layout,
      edges: this.normalizeEdges(layout.nodes, [
        ...layout.edges.filter((edge) => edge.id !== connectionId && edge.source !== source && edge.target !== target),
        { id: connectionId, source, target },
      ]),
    };
  }

  synchronizeTasks(layout: ProcessFlowLayout, tasks: readonly ProcessTaskFormModel[]): ProcessTaskFormModel[] {
    const orderedRefs = this.orderNodeIds(layout)
      .map((nodeId) => layout.nodes.find((node) => node.id === nodeId)?.taskRef)
      .filter((value): value is string => !!value);
    const orderedRefSet = new Set(orderedRefs);
    const byRef = new Map(tasks.map((task) => [task.clientId, task]));
    const orderedTasks = [
      ...orderedRefs.map((taskRef) => byRef.get(taskRef)).filter((task): task is ProcessTaskFormModel => !!task),
      ...tasks.filter((task) => !orderedRefSet.has(task.clientId)),
    ];

    return normalizeTaskOrders(orderedTasks);
  }

  synchronizeLayout(layout: ProcessFlowLayout, tasks: readonly ProcessTaskFormModel[]): ProcessFlowLayout {
    const normalizedLayout = this.withDerivedTaskOrder(layout);
    const normalizedTasks = normalizeTaskOrders(tasks);
    const byRef = new Map(normalizedLayout.nodes.map((node) => [node.taskRef, node]));
    const byOrder = new Map(
      normalizedLayout.nodes
        .filter((node) => node.taskOrder != null)
        .map((node) => [node.taskOrder!, node])
    );
    const idRemap = new Map<string, string>();
    const nodes = normalizedTasks.map((task, index) => {
      const existing = byRef.get(task.clientId) ?? byOrder.get(task.taskOrder);
      if (!existing) {
        return this.mapper.createNode(task, index);
      }
      idRemap.set(existing.id, task.clientId);
      return {
        ...existing,
        id: task.clientId,
        taskRef: task.clientId,
        taskOrder: task.taskOrder,
        type: task.taskType,
      };
    });
    const edges = this.normalizeEdges(
      nodes,
      layout.edges.map((edge) => {
        const source = idRemap.get(edge.source) ?? edge.source;
        const target = idRemap.get(edge.target) ?? edge.target;
        return {
          id: this.edgeId(source, target),
          source,
          target,
        };
      })
    );

    return {
      ...normalizedLayout,
      nodes,
      edges,
    };
  }

  private withDerivedTaskOrder(layout: ProcessFlowLayout): ProcessFlowLayout {
    const orderedIds = this.orderNodeIds(layout);
    const orderMap = new Map(orderedIds.map((nodeId, index) => [nodeId, index + 1]));
    return {
      ...layout,
      nodes: layout.nodes.map((node) => ({
        ...node,
        taskOrder: node.taskOrder ?? orderMap.get(node.id),
      })),
    };
  }

  private normalizeEdges(layoutNodes: ProcessFlowLayout['nodes'], edges: ProcessFlowLayout['edges']): ProcessFlowLayout['edges'] {
    const nodeIds = new Set(layoutNodes.map((node) => node.id));
    const seenOutputs = new Set<string>();
    const seenInputs = new Set<string>();
    const normalized: ProcessFlowLayout['edges'] = [];

    for (const edge of edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target) || edge.source === edge.target) {
        continue;
      }
      if (seenOutputs.has(edge.source) || seenInputs.has(edge.target)) {
        continue;
      }
      seenOutputs.add(edge.source);
      seenInputs.add(edge.target);
      normalized.push({
        id: edge.id || this.edgeId(edge.source, edge.target),
        source: edge.source,
        target: edge.target,
      });
    }

    return normalized;
  }

  private orderNodeIds(layout: ProcessFlowLayout): string[] {
    const nodes = [...layout.nodes].sort((left, right) =>
      left.position.x === right.position.x
        ? left.position.y - right.position.y
        : left.position.x - right.position.x
    );
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const indegree = new Map(nodes.map((node) => [node.id, 0]));
    const adjacency = new Map<string, string[]>();

    for (const edge of layout.edges) {
      indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
      adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
    }

    const queue = nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0).map((node) => node.id);
    const ordered: string[] = [];

    while (queue.length) {
      const current = queue.shift()!;
      if (ordered.includes(current)) {
        continue;
      }
      ordered.push(current);

      const neighbors = [...(adjacency.get(current) ?? [])].sort((left, right) => {
        const leftNode = nodeMap.get(left)!;
        const rightNode = nodeMap.get(right)!;
        return leftNode.position.x === rightNode.position.x
          ? leftNode.position.y - rightNode.position.y
          : leftNode.position.x - rightNode.position.x;
      });

      for (const neighbor of neighbors) {
        indegree.set(neighbor, (indegree.get(neighbor) ?? 1) - 1);
        if ((indegree.get(neighbor) ?? 0) <= 0) {
          queue.push(neighbor);
        }
      }
    }

    for (const node of nodes) {
      if (!ordered.includes(node.id)) {
        ordered.push(node.id);
      }
    }

    return ordered;
  }

  private toNodeId(connectorId: string | undefined): string | null {
    return connectorId ? connectorId.replace(this.connectorSuffixPattern, '') : null;
  }

  private edgeId(source: string, target: string): string {
    return `edge-${source}-${target}`;
  }
}
