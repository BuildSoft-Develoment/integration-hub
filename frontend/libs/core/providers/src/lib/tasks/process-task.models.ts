/**
 * Tipos de tarea reconocidos por el motor de procesos (spec 003).
 *
 * <p>Tipos base del motor: {@code FILE_READ}, {@code DB_WRITE}, {@code DB_EXECUTE_SP},
 * {@code DB_EXECUTE_FN}, {@code REST_CALL}, {@code NOTIFICATION}.</p>
 *
 * <p>ADR-021: <b>solo los del motor</b>. La deuda que este comentario anunciaba —"union cerrado por
 * parsimonia... el cierre limpio para verticales introduce un registro por Injection Token"— quedo
 * pagada: los verticales se registran por {@code PROCESS_TASK_PROVIDERS} y sus tipos viajan por
 * {@link ProcessTaskType}, que es abierto. Agregar un tipo de vertical aca volveria a atar el core
 * a un estandar.</p>
 */
export type PlatformProcessTaskType =
  // --- Motor (spec 003) ---
  | 'FILE_READ'
  | 'DB_WRITE'
  | 'DB_EXECUTE_SP'
  | 'DB_EXECUTE_FN'
  | 'REST_CALL'
  | 'NOTIFICATION'
  // --- Capa de salida generica (ADR-016) ---
  | 'FILE_WRITE'
  | 'FILE_COMPRESS'
  | 'FILE_DELIVER';
// ADR-021: los tipos de un VERTICAL no entran en esta union. Vivian aca los 12 de MT101, asi que
// dar de alta un estandar obligaba a editar una lib del core. Un tipo de vertical viaja por
// ProcessTaskType (abierto) y los mapas del motor son Partial con fallback: nunca necesito
// nombrarlos.

/**
 * Tipo de tarea usado por procesos.
 *
 * Los tipos de plataforma siguen tipados por union cerrada en {@link PlatformProcessTaskType}.
 * Los plugins backend aportan tipos remotos en runtime via `/api/task-types`; por eso el
 * contrato público queda abierto sin relajar los mapas exhaustivos del core.
 */
export type ProcessTaskType = PlatformProcessTaskType | (string & {});

export interface SourceRef {
  id: number;
  name: string;
  sourceType?: string;
  active?: boolean;
  configurationJson?: string;
  // ADR-016: INPUT / OUTPUT (sink) / BOTH. El picker de FILE_DELIVER ofrece solo OUTPUT/BOTH.
  direction?: string;
}

export interface ReaderRef {
  id: number;
  name: string;
  readerType?: string;
  active?: boolean;
  configurationJson?: string;
}

export interface ConnectionRef {
  id: number;
  name: string;
  connectionType: string;
}

export interface ProcessTaskFormModel {
  clientId: string;
  id: number | null;
  taskOrder: number;
  taskType: ProcessTaskType;
  active: boolean;
  sourceDefinitionId: number | null;
  readerDefinitionId: number | null;
  configurationJson: string;
}
