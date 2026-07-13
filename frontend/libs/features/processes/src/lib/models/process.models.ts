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
  const clientId = `task-${nextTaskClientId++}`;
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
    clientId: `task-${task.id ?? nextTaskClientId++}`,
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

