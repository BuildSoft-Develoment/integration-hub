export type ProcessTaskExecutionMode = 'once' | 'per-record' | 'batch';

export type ProcessTaskOutputKind = 'metadata' | 'summary' | 'records' | 'table' | 'errors' | 'out' | 'fragments';

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

/**
 * Configuracion comun de una peticion HTTP saliente, reutilizada por la tarea REST_CALL y por
 * el canal `webhook` de NOTIFICATION (ADR-005). Cubre endpoint (metodo/baseUrl/timeout), path,
 * query, headers, autenticacion y body con tokens.
 */
export interface HttpRequestDraft {
  method: string;
  baseUrl: string;
  pathTemplate: string;
  url: string;
  pathParameters: ProcessTaskBodyFieldBindingDraft[];
  queryParameters: ProcessTaskBodyFieldBindingDraft[];
  headerMappings: ProcessTaskBodyFieldBindingDraft[];
  bodyTemplate: string;
  timeoutSeconds: string;
  authType: string;
  username: string;
  password: string;
  token: string;
  loginUrl: string;
  loginMethod: string;
  loginHeadersJson: string;
  loginBodyTemplate: string;
  tokenPath: string;
}
