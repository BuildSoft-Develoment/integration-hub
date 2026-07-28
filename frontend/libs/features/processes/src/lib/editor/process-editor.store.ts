import { computed, inject, Injectable, signal } from '@angular/core';

import { AuthAccessService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { PROCESS_TEMPLATE_REGISTRY } from '@integration-hub/core/providers';

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
  /** ADR-021: plantillas de proceso que aportan los verticales; el editor solo las ensambla. */
  private readonly templates = inject(PROCESS_TEMPLATE_REGISTRY, { optional: true }) ?? [];

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
  /** ADR-021: plantillas que el editor puede ofrecer; las aporta cada vertical, no el motor. */
  readonly availableTemplates = this.templates;
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
   * ADR-021: aplica una plantilla REGISTRADA por un vertical. Antes este metodo se llamaba
   * `applyMassiveMt101Template` y traia los 6 tipos de MT101 con sus configs escritos aca:
   * una store generica que conocia un estandar. Ahora aporta solo el ensamblado.
   */
  applyTemplate(templateId: string): void {
    const template = this.templates.find((item) => item.id === templateId);
    if (!template) {
      // Politica no-fallback: una plantilla ausente es un error de cableado, no un no-op.
      throw new Error(`process template not registered: ${templateId}`);
    }
    const specs = template.tasks;

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
    // Conecta las tareas en cadena lineal (task[i] -> task[i+1]) para que el
    // flujo quede con sus conectores; sin esto los nodos aparecian sueltos.
    // El id se completa en normalizeEdges (edge.id || edgeId(source,target)).
    const chainEdges = tasks.slice(0, -1).map((task, index) => ({
      id: '',
      source: task.clientId,
      target: tasks[index + 1].clientId,
    }));
    const layout = {
      ...this.form().flowLayout,
      nodes: [],
      edges: chainEdges,
    };
    this.applyFlowState(layout, tasks);
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

  /**
   * ADR-021: misma resolucion que el panel de runtime — gana la salida que DECLARA el provider y
   * si no declara, el default de los tipos propios del motor.
   *
   * <p>Antes esto era un clon del switch que vivia en el binding context, y ya estaba
   * desincronizado: le faltaba el case de `MT101_BUILD_FROM_TABLE`, asi que encadenar desde el
   * editor de flujo sugeria `summary` mientras el panel de runtime sugeria `fragments` para la
   * MISMA tarea origen. Con una sola fuente de verdad (el descriptor) no puede volver a pasar.</p>
   */
  private defaultSourceOutput(taskType: ProcessTaskType): ProcessTaskOutputKind {
    const declared = this.taskManager?.resolve(taskType)?.descriptor.defaultOutput;
    if (declared) {
      return declared;
    }
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
