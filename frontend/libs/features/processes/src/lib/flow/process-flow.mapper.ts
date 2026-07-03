import { Injectable } from '@angular/core';
import { ProcessTaskFormModel } from '../models/process.models';
import {
  DEFAULT_PROCESS_FLOW_NODE_SIZE,
  DEFAULT_PROCESS_FLOW_VIEWPORT,
  ProcessFlowEdge,
  ProcessFlowLayout,
  ProcessFlowNode,
  ProcessFlowNodePosition,
  ProcessNodeDispatch,
} from '../models/process-flow.models';

@Injectable({ providedIn: 'root' })
export class ProcessFlowMapper {
  private readonly horizontalGap = 340;
  private readonly startX = 80;
  private readonly startY = 120;

  createLayout(tasks: readonly ProcessTaskFormModel[]): ProcessFlowLayout {
    const orderedTasks = [...tasks].sort((left, right) => left.taskOrder - right.taskOrder);
    const nodes = orderedTasks.map((task, index) => this.createNode(task, index));
    return {
      version: 1,
      viewport: { ...DEFAULT_PROCESS_FLOW_VIEWPORT },
      nodes,
      edges: this.createEdges(nodes),
    };
  }

  parseLayout(flowLayoutJson: string | null | undefined): ProcessFlowLayout | null {
    if (!flowLayoutJson?.trim()) {
      return null;
    }

    try {
      const parsed = JSON.parse(flowLayoutJson) as any;
      if (parsed && !Array.isArray(parsed.nodes) && parsed.nodes && parsed.connections) {
        return {
          version: 1,
          viewport: parsed.transform
            ? {
                x: Number(parsed.transform.x ?? 0),
                y: Number(parsed.transform.y ?? 0),
                zoom: Number(parsed.transform.zoom ?? 1),
              }
            : { ...DEFAULT_PROCESS_FLOW_VIEWPORT },
          nodes: Object.values(parsed.nodes).map((node: any, index: number) => ({
            id: String(node.id),
            taskRef: String(node.taskRef),
            taskOrder: Number(node.taskOrder ?? index + 1),
            type: node.type,
            position: {
              x: Number(node.position?.x ?? 0),
              y: Number(node.position?.y ?? 0),
            },
            size: { ...DEFAULT_PROCESS_FLOW_NODE_SIZE },
          })),
          edges: Object.values(parsed.connections).map((edge: any) => ({
            id: String(edge.id),
            source: String(edge.source).replace(/-out$/, ''),
            target: String(edge.target).replace(/-in$/, ''),
          })),
        };
      }

      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        return null;
      }

      return {
        version: parsed.version ?? 1,
        viewport: parsed.viewport ?? { ...DEFAULT_PROCESS_FLOW_VIEWPORT },
        nodes: parsed.nodes.map((node: any, index: number) => ({
          id: String(node.id),
          taskRef: String(node.taskRef),
          taskOrder: Number(node.taskOrder ?? index + 1),
          type: node.type!,
          position: {
            x: Number(node.position?.x ?? 0),
            y: Number(node.position?.y ?? 0),
          },
          size: {
            width: Number(node.size?.width ?? DEFAULT_PROCESS_FLOW_NODE_SIZE.width),
            height: Number(node.size?.height ?? DEFAULT_PROCESS_FLOW_NODE_SIZE.height),
          },
        })),
        edges: parsed.edges.map((edge: any) => ({
          id: String(edge.id),
          source: String(edge.source),
          target: String(edge.target),
        })),
      };
    } catch {
      return null;
    }
  }

  serializeLayout(layout: ProcessFlowLayout): string {
    return JSON.stringify(layout, null, 2);
  }

  createNode(task: ProcessTaskFormModel, index: number, position?: ProcessFlowNodePosition): ProcessFlowNode {
    return {
      id: task.clientId,
      taskRef: task.clientId,
      taskOrder: task.taskOrder,
      type: task.taskType,
      position: position ?? {
        x: this.startX + index * this.horizontalGap,
        y: this.startY,
      },
      size: { ...DEFAULT_PROCESS_FLOW_NODE_SIZE },
      dispatch: this.dispatchFor(task),
    };
  }

  /** Deriva el badge de despacho del config (ADR-015): async + batch/per-record = scatter distribuido. */
  private dispatchFor(task: ProcessTaskFormModel): ProcessNodeDispatch | undefined {
    try {
      const config = JSON.parse(task.configurationJson || '{}');
      if (!config || typeof config !== 'object' || config.async !== true) {
        return undefined;
      }
      const mode = String(config.executionMode || 'once');
      return mode === 'batch' || mode === 'per-record' ? 'scatter' : 'async';
    } catch {
      return undefined;
    }
  }

  createEdges(nodes: readonly ProcessFlowNode[]): ProcessFlowEdge[] {
    return nodes.slice(0, -1).map((node, index) => ({
      id: `edge-${node.id}-${nodes[index + 1].id}`,
      source: node.id,
      target: nodes[index + 1].id,
    }));
  }
}
