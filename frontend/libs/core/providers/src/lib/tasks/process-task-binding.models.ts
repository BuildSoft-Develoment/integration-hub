export type ProcessTaskExecutionMode = 'once' | 'per-record' | 'batch';

export type ProcessTaskOutputKind = 'metadata' | 'summary' | 'records' | 'table' | 'errors' | 'out';

export type ProcessTaskBindingKind = 'field' | 'variable' | ProcessTaskOutputKind | 'expression';

export interface ProcessTaskInputDraft {
  source: 'task-output';
  sourceTaskRef: string;
  sourceOutput: ProcessTaskOutputKind;
  batchSize?: string;
  connectionRef?: string;
  table?: string;
}

export interface ProcessTaskRuntimeDraft {
  taskRef: string;
  executionMode: ProcessTaskExecutionMode;
  input?: ProcessTaskInputDraft;
}

export interface ProcessTaskBindingOption {
  key: string;
  label: string;
  kind: Exclude<ProcessTaskBindingKind, 'expression'>;
  groupKey: string;
  hint?: string;
}

export interface ProcessTaskBindingDraft {
  sourceKind: ProcessTaskBindingKind | null;
  sourceKey: string;
  sourceLabel: string;
  expression: string;
}

export interface ProcessTaskParameterBindingDraft extends ProcessTaskBindingDraft {
  name: string;
  jdbcType: string;
  direction?: string;
}

export interface ProcessTaskBodyFieldBindingDraft extends ProcessTaskBindingDraft {
  name: string;
}
