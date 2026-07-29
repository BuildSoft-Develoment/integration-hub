import type {
  ConnectionRef,
  PlatformProcessTaskType,
  ProcessTaskOutputKind,
  ProcessTaskFormModel,
  ProcessTaskType,
  ReaderRef,
  SourceRef,
} from '@integration-hub/core/providers';
export type {
  ConnectionRef,
  PlatformProcessTaskType,
  ProcessTaskOutputKind,
  ProcessTaskFormModel,
  ProcessTaskType,
  ReaderRef,
  SourceRef,
} from '@integration-hub/core/providers';
import { ProcessFlowLayout } from './process-flow.models';
import { ProcessFlowMapper } from '../flow/process-flow.mapper';
import { ProcessFlowSyncService } from '../flow/process-flow-sync.service';

export interface DefinitionRef {
  id: number;
  name: string;
}

export interface ProcessTaskRecord {
  id: number | null;
  taskOrder: number;
  taskType: ProcessTaskType;
  active: boolean;
  configurationJson: string;
  sourceDefinition?: DefinitionRef | null;
  readerDefinition?: DefinitionRef | null;
}

export interface ProcessRecord {
  id: number;
  name: string;
  description: string;
  active: boolean;
  scheduled: boolean;
  scheduleEvery: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  flowLayoutJson?: string | null;
  tasks: ProcessTaskRecord[];
}

export interface ProcessFormModel {
  id: number | null;
  name: string;
  description: string;
  active: boolean;
  scheduled: boolean;
  scheduleEvery: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  flowLayout: ProcessFlowLayout;
  tasks: ProcessTaskFormModel[];
}

export const processTaskTypes: readonly ProcessTaskType[] = [
  'FILE_READ',
  'DB_WRITE',
  'DB_EXECUTE_SP',
  'DB_EXECUTE_FN',
  'REST_CALL',
  'NOTIFICATION',
];

let nextTaskClientId = 1;

export function createTaskForm(
  taskType: ProcessTaskType = 'FILE_READ',
  taskOrder = 1,
  configurationJson?: string,
): ProcessTaskFormModel {
  // Namespace SEPARADO del de las tareas cargadas (`task-<id de BD>`): un contador `task-N` a secas colisionaba
  // con un `task-<id>` cuando el contador alcanzaba ese id (dos nodos con el mismo clientId -> el flow @foblex
  // tiraba "Node already exists: task-3"). El prefijo `task-new-` no puede igualar a `task-<numero>`.
  const clientId = `task-new-${nextTaskClientId++}`;
  return {
    clientId,
    id: null,
    taskOrder,
    taskType,
    active: true,
    sourceDefinitionId: null,
    readerDefinitionId: null,
    // El caller (ProcessEditorStore) pasa el config derivado del provider
    // registrado via ProcessTaskManagerService.defaultConfigurationJson().
    // Si no hay config, se usa un placeholder vacio (politica no-fallback:
    // la ausencia de provider es error, no debe caer a defaultTaskConfig).
    configurationJson: configurationJson ?? '{}',
  };
}

export function toProcessTaskFormModel(task: ProcessTaskRecord): ProcessTaskFormModel {
  return {
    // Con id de BD: `task-<id>` (unico). Sin id (defensivo): el mismo namespace `task-new-` de las nuevas.
    clientId: task.id != null ? `task-${task.id}` : `task-new-${nextTaskClientId++}`,
    id: task.id,
    taskOrder: task.taskOrder,
    taskType: task.taskType,
    active: task.active,
    sourceDefinitionId: task.sourceDefinition?.id ?? null,
    readerDefinitionId: task.readerDefinition?.id ?? null,
    configurationJson: task.configurationJson || '{}',
  };
}

export function createProcessForm(): ProcessFormModel {
  const tasks = [createTaskForm('FILE_READ', 1)];
  const mapper = new ProcessFlowMapper();
  return {
    id: null,
    name: '',
    description: '',
    active: true,
    scheduled: false,
    scheduleEvery: '',
    nextRunAt: null,
    lastRunAt: null,
    flowLayout: mapper.createLayout(tasks),
    tasks,
  };
}

export function toProcessFormModel(process: ProcessRecord): ProcessFormModel {
  const tasks = process.tasks?.map((task, index) => ({ ...toProcessTaskFormModel(task), taskOrder: index + 1 })) ?? [];
  const sync = new ProcessFlowSyncService();
  return {
    id: process.id,
    name: process.name,
    description: process.description,
    active: process.active,
    scheduled: process.scheduled,
    scheduleEvery: process.scheduleEvery,
    nextRunAt: process.nextRunAt,
    lastRunAt: process.lastRunAt,
    flowLayout: sync.initialize({
      tasks,
      flowLayoutJson: process.flowLayoutJson,
    }),
    tasks,
  };
}

export function normalizeTaskOrders(tasks: readonly ProcessTaskFormModel[]): ProcessTaskFormModel[] {
  return tasks.map((task, index) => ({ ...task, taskOrder: index + 1 }));
}

/** `taskRef` de una tarea, o `null` si no tiene o su configuracion no parsea. */
function taskRefOf(task: ProcessTaskFormModel): string | null {
  try {
    const ref = String(JSON.parse(task.configurationJson || '{}')['taskRef'] ?? '').trim();
    return ref.length > 0 ? ref : null;
  } catch {
    return null;
  }
}

/**
 * Primer `<base>-N` que no este tomado por otra tarea del proceso.
 *
 * <p>El `taskRef` es el identificador de cableado: `input.sourceTaskRef` apunta a el, y en el money-path
 * `resolvesPayTaskRef` nombra a que MT101_PAY concilia un MT101_STATUS. Duplicado, la referencia se
 * resuelve por "el primero que coincida", asi que el pipeline armado no es el dibujado — y en el
 * money-path se concilia contra un pago que no es. El backend lo rechaza (TaskRefUniquenessValidator);
 * esto evita que el operador llegue a ese error por un default del editor.</p>
 *
 * <p>Antes se derivaba de `tasks.length + 1`, que colisiona apenas se borra una tarea del medio.</p>
 */
export function nextFreeTaskRef(base: string, tasks: readonly ProcessTaskFormModel[]): string {
  const enUso = new Set(tasks.map(taskRefOf).filter((ref): ref is string => ref !== null));
  let sufijo = 1;
  while (enUso.has(`${base}-${sufijo}`)) {
    sufijo += 1;
  }
  return `${base}-${sufijo}`;
}

export function summarizeTask(task: ProcessTaskFormModel, sources: readonly SourceRef[], readers: readonly ReaderRef[]): string {
  const parts: string[] = [task.taskType];
  if (task.taskType === 'FILE_READ') {
    const source = sources.find((item) => item.id === task.sourceDefinitionId);
    const reader = readers.find((item) => item.id === task.readerDefinitionId);
    if (source) parts.push(`fuente=${source.name}`);
    if (reader) parts.push(`reader=${reader.name}`);
  }
  return parts.join(' | ');
}

