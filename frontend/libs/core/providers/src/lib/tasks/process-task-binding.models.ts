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
  /**
   * Paginacion keyset de la lectura por tabla. Lo lee el motor en
   * {@code TaskInputResolver} (`input.cursor.orderBy`) y es OBLIGATORIO para el batching por tabla.
   * Ningun formulario lo edita todavia: se transporta para no borrarlo al guardar.
   */
  cursor?: { orderBy?: string };
  /**
   * Predicados columna→valor que acotan QUE FILAS lee la tarea (admite tokens como
   * {@code ${_processExecutionId}}). Lo lee el motor en {@code TaskInputResolver}.
   * Perderlo NO falla: elimina el WHERE y la tarea pasa a consumir la TABLA ENTERA. Por eso se transporta.
   */
  filters?: Record<string, unknown>;
}

export interface ProcessTaskRuntimeDraft {
  taskRef: string;
  executionMode: ProcessTaskExecutionMode;
  input?: ProcessTaskInputDraft;
  // Despacho async (ADR-015): offload de la tarea a un broker. `asyncTransport` y `continueOnFailure`
  // solo aplican con `async=true` (este ultimo, en modo batch/per-record = scatter). Clave propia
  // `asyncTransport` (no `transport`) para no colisionar con el `transport` de dominio de MT101.
  async?: boolean;
  asyncTransport?: string;
  continueOnFailure?: boolean;
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
