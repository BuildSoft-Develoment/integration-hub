import { ProcessTaskFormModel, ProcessTaskType } from './process.models';

export interface ProcessFlowViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface ProcessFlowNodePosition {
  x: number;
  y: number;
}

export interface ProcessFlowNodeSize {
  width: number;
  height: number;
}

export interface ProcessFlowNode {
  id: string;
  taskRef: string;
  taskOrder?: number;
  type: ProcessTaskType;
  position: ProcessFlowNodePosition;
  size?: ProcessFlowNodeSize;
}

export interface ProcessFlowEdge {
  id: string;
  source: string;
  target: string;
}

export interface ProcessFlowLayout {
  version: number;
  viewport: ProcessFlowViewport;
  nodes: ProcessFlowNode[];
  edges: ProcessFlowEdge[];
}

export const DEFAULT_PROCESS_FLOW_VIEWPORT: ProcessFlowViewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const DEFAULT_PROCESS_FLOW_NODE_SIZE: ProcessFlowNodeSize = {
  width: 220,
  height: 120,
};

export interface ProcessTaskFlowContext {
  tasks: readonly ProcessTaskFormModel[];
  flowLayoutJson?: string | null;
}
