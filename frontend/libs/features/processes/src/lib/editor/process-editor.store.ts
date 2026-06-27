import { computed, inject, Injectable, signal } from '@angular/core';

import { AuthAccessService, ProcessTaskManagerService } from '@integration-hub/core/services';

import { ProcessFlowApiService } from '../api/process-flow-api.service';
import { ProcessFlowNodePosition } from '../models/process-flow.models';
import { ProcessFlowSyncService } from '../flow/process-flow-sync.service';
import { ProcessFormFactoryService } from '../forms/process-form-factory.service';
import {
  createTaskForm,
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
  // M-1a: el config inicial sale del provider registrado via el manager.
  // Optional: true para tests que no proveen el servicio.
  private readonly taskManager = inject(ProcessTaskManagerService, { optional: true });

  readonly saving = signal(false);
  readonly executing = signal(false);
  readonly selectedProcessId = signal<number | null>(null);
  readonly selectedProcess = signal<ProcessRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly viewMode = signal<ViewMode>('details');
  readonly form = signal<ProcessFormModel>(this.formFactory.create());

  private formSnapshot = '';

  readonly dirty = computed(() => {
    if (this.viewMode() !== 'edit') { return false; }
    return JSON.stringify(this.form()) !== this.formSnapshot;
  });

  readonly canEdit = computed(() => this.access.canAdmin());
  readonly canOperate = computed(() => this.access.canOperate());
  readonly formTitle = computed(() =>
    this.viewMode() === 'edit'
      ? this.form().id
        ? 'processes.edit'
        : 'processes.create'
      : 'processes.detail'
  );

  canDiscard(): boolean {
    return !this.dirty();
  }

  selectProcess(process: ProcessRecord): void {
    this.selectedProcessId.set(process.id);
    this.selectedProcess.set(process);
    this.form.set(this.formFactory.fromRecord(process));
    this.viewMode.set('details');
    this.drawerOpen.set(true);
  }

  startCreate(): void {
    this.form.set(this.formFactory.create());
    this.formSnapshot = JSON.stringify(this.form());
    this.viewMode.set('edit');
    this.drawerOpen.set(true);
  }

  startEdit(process: ProcessRecord): void {
    this.selectedProcessId.set(process.id);
    this.selectedProcess.set(process);
    this.form.set(this.formFactory.fromRecord(process));
    this.formSnapshot = JSON.stringify(this.form());
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
      const nextOrder = current.tasks.length + 1;
      const provisionalRef = `task-${nextOrder}`;
      const tasks = normalizeTaskOrders([
        ...current.tasks,
        this.withSuggestedInput(
          createTaskForm(taskType, nextOrder, this.defaultConfigurationJson(taskType, provisionalRef)),
          current.tasks,
        ),
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

  /**
   * Plantilla "MT101 masivo desde archivo": scaffolda la cadena completa con
   * los bindings de fragments PRE-CABLEADOS, evitando que el auto-binding elija
   * records/summary cuando corresponde fragments (hallazgo H2). Todas las tareas
   * MT101 downstream consumen `<build>.fragments` (la referencia al set
   * persistido); cada etapa filtra por su gate de estado.
   */
  applyMassiveMt101Template(): void {
    const buildRef = 'build-mt101-masivo';
    const fragmentsInput = {
      source: 'task-output' as const,
      sourceTaskRef: buildRef,
      sourceOutput: 'fragments' as const,
    };
    const specs: Array<{ taskType: ProcessTaskType; ref: string; overrides: Record<string, unknown> }> = [
      { taskType: 'FILE_READ', ref: 'leer-archivo', overrides: { executionMode: 'batch' } },
      { taskType: 'DB_WRITE', ref: 'staging', overrides: {
          executionMode: 'batch',
          mode: 'insert',
          targetTable: 'staging_record',
          jdbcBatchSize: 5000,
          input: { source: 'task-output', sourceTaskRef: 'leer-archivo', sourceOutput: 'records' },
        } },
      { taskType: 'MT101_BUILD_FROM_TABLE', ref: buildRef, overrides: {
          executionMode: 'once',
          input: { source: 'task-output', sourceTaskRef: 'staging', sourceOutput: 'table' },
          fragmentSetIdTemplate: 'MT101-${_processExecutionId}',
          replaceExisting: true,
          maxTransactionsPerMessage: 100,
          maxBytesPerMessage: 10000,
          maxRecordsInOutput: 1000,
        } },
      { taskType: 'MT101_VALIDATE', ref: 'validar', overrides: {
          executionMode: 'once',
          input: fragmentsInput,
          pageSize: 200,
          publishIssuesTo: 'table:mt101_validation_issue',
          maxIssuesInOutput: 1000,
        } },
      { taskType: 'MT101_ARCHIVE', ref: 'archivar', overrides: {
          executionMode: 'once',
          input: fragmentsInput,
          pageSize: 200,
          maxRecordsInOutput: 1000,
        } },
      { taskType: 'MT101_PAY', ref: 'pagar', overrides: {
          executionMode: 'once',
          input: fragmentsInput,
          pageSize: 200,
          maxRecordsInOutput: 1000,
        } },
    ];

    const tasks = normalizeTaskOrders(specs.map((spec, index) => {
      const base = this.defaultConfigurationJson(spec.taskType, spec.ref);
      let config: Record<string, unknown>;
      try {
        config = JSON.parse(base || '{}');
      } catch {
        config = {};
      }
      config = { ...config, taskRef: spec.ref, ...spec.overrides };
      return createTaskForm(spec.taskType, index + 1, JSON.stringify(config, null, 2));
    }));
    // Reusa applyFlowState: sincroniza el layout creando nodos para las nuevas
    // tareas. Parte de un layout vacio (mismo viewport/version actual) para
    // reemplazar el contenido del editor con la cadena masiva completa.
    const emptyLayout = {
      ...this.form().flowLayout,
      nodes: [],
      edges: [],
    };
    this.applyFlowState(emptyLayout, tasks);
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
                ? this.withSuggestedInput({
                    ...task,
                    ...patch,
                    taskType: nextType,
                    configurationJson: this.defaultConfigurationJson(nextType, task.clientId),
                  }, previousTasks).configurationJson
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
    const suggested = this.suggestedInput(task.taskType, previousTasks);
    if (!suggested) {
      return task;
    }
    try {
      const parsed = JSON.parse(task.configurationJson || '{}');
      if (parsed?.input?.sourceTaskRef) {
        return task;
      }
      return {
        ...task,
        configurationJson: JSON.stringify({
          ...parsed,
          input: {
            source: 'task-output',
            sourceTaskRef: suggested.sourceTaskRef,
            sourceOutput: suggested.sourceOutput,
          },
        }, null, 2),
      };
    } catch {
      // Si el JSON es invalido, se queda con la config actual.
    }
    return task;
  }

  private defaultConfigurationJson(taskType: ProcessTaskType, taskRef: string): string {
    return this.taskManager?.defaultConfigurationJson(taskType, taskRef) ?? '{}';
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
      case 'MT101_BUILD':
      case 'MT101_PARSE':
      case 'MT101_SPLIT':
      case 'MT101_REPAIR':
      case 'MT101_ARCHIVE':
      case 'MT101_PAY':
      case 'MT101_ROUTE':
      case 'MT101_RECONCILE':
      case 'MT101_STATUS':
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
