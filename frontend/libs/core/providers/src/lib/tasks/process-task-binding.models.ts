export type ProcessTaskBindingKind = 'field' | 'variable' | 'metadata' | 'expression';

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
