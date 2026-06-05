import { computed, inject, Injectable, signal } from '@angular/core';

import { AuthAccessService } from '@integration-hub/core/services';

import { ProcessFlowApiService } from '../api/process-flow-api.service';
import { ProcessFlowNodePosition } from '../models/process-flow.models';
import { ProcessFlowSyncService } from '../flow/process-flow-sync.service';
import { ProcessFormFactoryService } from '../forms/process-form-factory.service';
import {
  createTaskForm,
  defaultTaskConfig,
  normalizeTaskOrders,
  ProcessFormModel,
  ProcessRecord,
  ProcessTaskFormModel,
  ProcessTaskOutputKind,
  ProcessTaskType,
} from '../models/process.models';

type ViewMode = 'details' | 'edit';

@Injectable()
export class ProcessEditorStore {
  private readonly access = inject(AuthAccessService);
  private readonly formFactory = inject(ProcessFormFactoryService);
  private readonly flowApi = inject(ProcessFlowApiService);
  private readonly flowSync = inject(ProcessFlowSyncService);

  readonly saving = signal(false);
  readonly executing = signal(false);
  readonly selectedProcessId = signal<number | null>(null);
  readonly selectedProcess = signal<ProcessRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly viewMode = signal<ViewMode>('details');
  readonly form = signal<ProcessFormModel>(this.formFactory.create());

  readonly canEdit = computed(() => this.access.canAdmin());
  readonly canOperate = computed(() => this.access.canOperate());
  readonly formTitle = computed(() =>
    this.viewMode() === 'edit'
      ? this.form().id
        ? 'processes.edit'
        : 'processes.create'
      : 'processes.detail'
  );

  selectProcess(process: ProcessRecord): void {
    this.selectedProcessId.set(process.id);
    this.selectedProcess.set(process);
    this.form.set(this.formFactory.fromRecord(process));
    this.viewMode.set('details');
    this.drawerOpen.set(true);
  }

  startCreate(): void {
    this.form.set(this.formFactory.create());
    this.viewMode.set('edit');
    this.drawerOpen.set(true);
  }

  startEdit(process: ProcessRecord): void {
    this.selectedProcessId.set(process.id);
    this.selectedProcess.set(process);
    this.form.set(this.formFactory.fromRecord(process));
    this.viewMode.set('edit');
    this.drawerOpen.set(true);
  }

  cancelEdit(): void {
    this.drawerOpen.set(false);
    this.viewMode.set('details');
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  patchForm(patch: Partial<ProcessFormModel>): void {
    this.form.update((current) => ({
      ...current,
      ...patch,
      scheduleEvery:
        patch.scheduled === false
          ? ''
          : (patch.scheduleEvery ?? current.scheduleEvery),
    }));
  }

  applyFlowLayout(layout: ProcessFormModel['flowLayout']): void {
    this.form.update((current) => {
      const flowLayout = this.flowSync.synchronizeLayout(layout, current.tasks);
      const tasks = this.flowSync.synchronizeTasks(flowLayout, current.tasks);
      return {
        ...current,
        tasks,
        flowLayout,
      };
    });
  }

  applyFlowState(
    layout: ProcessFormModel['flowLayout'],
    tasks: ProcessTaskFormModel[]
  ): void {
    this.form.update((current) => ({
      ...current,
      flowLayout: this.flowSync.synchronizeLayout(layout, tasks),
      tasks: normalizeTaskOrders(tasks),
    }));
  }

  addTask(taskType: ProcessTaskType = 'FILE_READ'): void {
    this.addTaskAt(taskType);
  }

  addTaskAt(
    taskType: ProcessTaskType,
    position?: ProcessFlowNodePosition
  ): void {
    this.form.update((current) => {
      const tasks = normalizeTaskOrders([
        ...current.tasks,
        this.withSuggestedInput(createTaskForm(taskType, current.tasks.length + 1), current.tasks),
      ]);
      const nextTask = tasks[tasks.length - 1];
      const flowLayout = this.flowApi.addTaskNode(
        current.flowLayout,
        nextTask,
        tasks.length,
        position,
        current.tasks
      );
      return {
        ...current,
        tasks: this.flowSync.synchronizeTasks(flowLayout, tasks),
        flowLayout,
      };
    });
  }

  updateTask(
    clientId: string,
    patch: Partial<ProcessTaskFormModel>
  ): void {
    this.form.update((current) => {
      const tasks = normalizeTaskOrders(
        current.tasks.map((task) => {
          if (task.clientId !== clientId) {
            return task;
          }

          const nextType = (patch.taskType ?? task.taskType) as ProcessTaskType;
          const previousTasks = current.tasks.filter((item) => item.clientId !== task.clientId);
          return {
            ...task,
            ...patch,
            configurationJson:
              patch.taskType && patch.taskType !== task.taskType
                ? defaultTaskConfig(nextType, task.clientId, this.suggestedInput(nextType, previousTasks))
                : (patch.configurationJson ?? task.configurationJson),
            sourceDefinitionId:
              nextType === 'FILE_READ'
                ? (patch.sourceDefinitionId ?? task.sourceDefinitionId)
                : null,
            readerDefinitionId:
              nextType === 'FILE_READ'
                ? (patch.readerDefinitionId ?? task.readerDefinitionId)
                : null,
          };
        })
      );

      const updatedTask = tasks.find((task) => task.clientId === clientId);
      const flowLayout = updatedTask
        ? this.flowSync.updateTaskType(
            this.flowSync.synchronizeLayout(current.flowLayout, tasks),
            updatedTask
          )
        : this.flowSync.synchronizeLayout(current.flowLayout, tasks);

      return {
        ...current,
        tasks: this.flowSync.synchronizeTasks(flowLayout, tasks),
        flowLayout,
      };
    });
  }

  private withSuggestedInput(task: ProcessTaskFormModel, previousTasks: readonly ProcessTaskFormModel[]): ProcessTaskFormModel {
    return {
      ...task,
      configurationJson: defaultTaskConfig(task.taskType, task.clientId, this.suggestedInput(task.taskType, previousTasks)),
    };
  }

  private suggestedInput(taskType: ProcessTaskType, previousTasks: readonly ProcessTaskFormModel[]): { sourceTaskRef: string; sourceOutput: ProcessTaskOutputKind } | undefined {
    if (taskType === 'FILE_READ') {
      return undefined;
    }
    const orderedPreviousTasks = [...previousTasks].sort((left, right) => left.taskOrder - right.taskOrder);
    const previousTask = orderedPreviousTasks.length ? orderedPreviousTasks[orderedPreviousTasks.length - 1] : null;
    if (!previousTask) {
      return undefined;
    }
    return {
      sourceTaskRef: this.configuredTaskRef(previousTask),
      sourceOutput: this.defaultSourceOutput(previousTask.taskType),
    };
  }

  private defaultSourceOutput(taskType: ProcessTaskType): ProcessTaskOutputKind {
    switch (taskType) {
      case 'DB_WRITE':
        return 'table';
      case 'DB_EXECUTE_SP':
      case 'DB_EXECUTE_FN':
        return 'out';
      case 'FILE_READ':
        return 'records';
      default:
        return 'summary';
    }
  }

  private configuredTaskRef(task: ProcessTaskFormModel): string {
    try {
      const parsed = JSON.parse(task.configurationJson || '{}');
      const configuredRef = String(parsed?.taskRef || '').trim();
      return configuredRef || task.clientId;
    } catch {
      return task.clientId;
    }
  }

  removeTask(clientId: string): void {
    this.form.update((current) => {
      const tasks = normalizeTaskOrders(
        current.tasks.filter((task) => task.clientId !== clientId)
      );
      const flowLayout = this.flowSync.removeTask(
        this.flowSync.synchronizeLayout(current.flowLayout, tasks),
        clientId
      );
      return {
        ...current,
        tasks: this.flowSync.synchronizeTasks(flowLayout, tasks),
        flowLayout,
      };
    });
  }

  showSavedProcess(process: ProcessRecord): void {
    this.selectedProcessId.set(process.id);
    this.selectedProcess.set(process);
    this.form.set(this.formFactory.fromRecord(process));
    this.viewMode.set('details');
    this.drawerOpen.set(true);
  }

  openSelectedProcess(process: ProcessRecord): void {
    this.selectedProcessId.set(process.id);
    this.refreshSelectedProcess(process);
    this.drawerOpen.set(true);
  }

  markSelectedProcess(processId: number): void {
    this.selectedProcessId.set(processId);
  }

  refreshSelectedProcess(process: ProcessRecord): void {
    this.selectedProcess.set(process);
    if (this.viewMode() === 'details') {
      this.form.set(this.formFactory.fromRecord(process));
    }
  }

  async trackSaving<T>(operation: () => Promise<T>): Promise<T> {
    this.saving.set(true);
    try {
      return await operation();
    } finally {
      this.saving.set(false);
    }
  }

  async trackExecuting<T>(operation: () => Promise<T>): Promise<T> {
    this.executing.set(true);
    try {
      return await operation();
    } finally {
      this.executing.set(false);
    }
  }
}
