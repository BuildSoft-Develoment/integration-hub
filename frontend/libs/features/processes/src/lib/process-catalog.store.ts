import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppFeedbackService, AuthService } from '@integration-hub/core/services';
import { ProcessApiService } from './process-api.service';
import { ProcessFlowApiService } from './process-flow-api.service';
import { ProcessFlowNodePosition } from './process-flow.models';
import { ProcessFormFactoryService } from './process-form-factory.service';
import { ProcessFlowSyncService } from './process-flow-sync.service';
import {
  createTaskForm,
  ConnectionRef,
  normalizeTaskOrders,
  ProcessFormModel,
  ProcessRecord,
  ProcessTaskFormModel,
  ProcessTaskType,
  ReaderRef,
  SourceRef,
} from './process.models';

type ViewMode = 'details' | 'edit';
type ScheduleFilter = 'ALL' | 'MANUAL' | 'SCHEDULED';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Injectable()
export class ProcessCatalogStore implements OnDestroy {
  private readonly api = inject(ProcessApiService);
  private readonly auth = inject(AuthService);
  private readonly feedback = inject(AppFeedbackService);
  private readonly formFactory = inject(ProcessFormFactoryService);
  private readonly flowApi = inject(ProcessFlowApiService);
  private readonly flowSync = inject(ProcessFlowSyncService);
  private readonly searchDebounceMs = 300;
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private requestSequence = 0;
  private referencesLoaded = false;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly executing = signal(false);
  readonly processes = signal<ProcessRecord[]>([]);
  readonly totalLength = signal(0);
  readonly sources = signal<SourceRef[]>([]);
  readonly readers = signal<ReaderRef[]>([]);
  readonly connections = signal<ConnectionRef[]>([]);
  readonly search = signal('');
  readonly scheduleFilter = signal<ScheduleFilter>('ALL');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly selectedProcessId = signal<number | null>(null);
  readonly selectedProcess = signal<ProcessRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);
  readonly viewMode = signal<ViewMode>('details');
  readonly form = signal<ProcessFormModel>(this.formFactory.create());

  readonly canEdit = computed(() => this.auth.canAdmin());
  readonly canOperate = computed(() =>
    this.auth.hasAnyRole(['platform-admin', 'integration-admin', 'operator'])
  );
  readonly pagedProcesses = computed(() => this.processes());
  readonly formTitle = computed(() =>
    this.viewMode() === 'edit'
      ? this.form().id
        ? 'processes.edit'
        : 'processes.create'
      : 'processes.detail'
  );

  async load(): Promise<void> {
    const referencePromise = this.referencesLoaded
      ? Promise.resolve()
      : this.loadReferenceData();
    await Promise.all([referencePromise, this.loadProcesses(true)]);
  }

  ngOnDestroy(): void {
    this.clearSearchDebounce();
  }

  selectProcess(process: ProcessRecord): void {
    this.selectedProcessId.set(process.id);
    this.selectedProcess.set(process);
    this.form.set(this.formFactory.fromRecord(process));
    this.viewMode.set('details');
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.clearSearchDebounce();
    this.pageSize.set(pageSize);
    this.currentPage.set(pageIndex);
    void this.loadProcesses(false);
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.scheduleSearchReload();
  }

  updateScheduleFilter(value: ScheduleFilter): void {
    this.scheduleFilter.set(value);
    this.clearSearchDebounce();
    void this.loadProcesses(true);
  }

  updateStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.clearSearchDebounce();
    void this.loadProcesses(true);
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

  patchForm(patch: Partial<ProcessFormModel>): void {
    this.form.update((current) => ({
      ...current,
      ...patch,
      scheduleEvery:
        patch.scheduled === false ? '' : (patch.scheduleEvery ?? current.scheduleEvery),
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

  applyFlowState(layout: ProcessFormModel['flowLayout'], tasks: ProcessTaskFormModel[]): void {
    this.form.update((current) => ({
      ...current,
      flowLayout: this.flowSync.synchronizeLayout(layout, tasks),
      tasks: normalizeTaskOrders(tasks),
    }));
  }

  addTask(taskType: ProcessTaskType = 'FILE_READ'): void {
    this.addTaskAt(taskType);
  }

  addTaskAt(taskType: ProcessTaskType, position?: ProcessFlowNodePosition): void {
    this.form.update((current) => {
      const tasks = normalizeTaskOrders([
        ...current.tasks,
        createTaskForm(taskType, current.tasks.length + 1),
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

  updateTask(clientId: string, patch: Partial<ProcessTaskFormModel>): void {
    this.form.update((current) => {
      const tasks = normalizeTaskOrders(
        current.tasks.map((task) => {
          if (task.clientId !== clientId) return task;
          const nextType = (patch.taskType ?? task.taskType) as ProcessTaskType;
          return {
            ...task,
            ...patch,
            configurationJson:
              patch.taskType && patch.taskType !== task.taskType
                ? createTaskForm(nextType, task.taskOrder).configurationJson
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

  async save(): Promise<void> {
    this.saving.set(true);
    try {
      const form = this.form();
      const payload = {
        name: form.name,
        description: form.description,
        active: form.active,
        scheduled: form.scheduled,
        scheduleEvery: form.scheduled ? form.scheduleEvery : '',
        flowLayoutJson: this.flowApi.serialize(
          this.flowSync.synchronizeLayout(form.flowLayout, form.tasks)
        ),
        tasks: normalizeTaskOrders(form.tasks).map((task, index) => ({
          taskOrder: index + 1,
          taskType: task.taskType,
          sourceDefinitionId:
            task.taskType === 'FILE_READ' ? task.sourceDefinitionId : null,
          readerDefinitionId:
            task.taskType === 'FILE_READ' ? task.readerDefinitionId : null,
          configurationJson: task.configurationJson?.trim() || '{}',
        })),
      };
      const saved = form.id
        ? await firstValueFrom(this.api.update(form.id, payload))
        : await firstValueFrom(this.api.create(payload));

      this.selectedProcessId.set(saved.id);
      this.selectedProcess.set(saved);
      this.form.set(this.formFactory.fromRecord(saved));
      this.viewMode.set('details');
      this.drawerOpen.set(true);
      await this.loadProcesses(false);
      this.feedback[form.id ? 'updated' : 'created']('entities.process');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(process: ProcessRecord): Promise<void> {
    const updated = await firstValueFrom(this.api.setActive(process.id, !process.active));
    this.selectedProcessId.set(updated.id);
    this.selectedProcess.set(updated);
    if (this.viewMode() === 'details') {
      this.form.set(this.formFactory.fromRecord(updated));
    }
    this.drawerOpen.set(true);
    await this.loadProcesses(false);
    this.feedback[process.active ? 'deactivated' : 'activated']('entities.process');
  }

  async execute(process: ProcessRecord): Promise<void> {
    this.executing.set(true);
    try {
      await firstValueFrom(this.api.execute(process.id));
      this.feedback.info('processes.executed');
      await this.loadProcesses(false);
      this.selectedProcessId.set(process.id);
      this.drawerOpen.set(true);
    } finally {
      this.executing.set(false);
    }
  }

  private async loadReferenceData(): Promise<void> {
    const [sources, readers, connections] = await Promise.all([
      firstValueFrom(this.api.listSources()),
      firstValueFrom(this.api.listReaders()),
      firstValueFrom(this.api.listConnections()),
    ]);
    this.sources.set(sources);
    this.readers.set(readers);
    this.connections.set(connections);
    this.referencesLoaded = true;
  }

  private async loadProcesses(resetPage: boolean): Promise<void> {
    if (resetPage) {
      this.currentPage.set(0);
    }

    const requestId = ++this.requestSequence;
    this.loading.set(true);
    try {
      const response = await firstValueFrom(
        this.api.list({
          search: this.search(),
          mode: this.scheduleFilter(),
          status: this.statusFilter(),
          page: this.currentPage(),
          size: this.pageSize(),
        })
      );

      if (requestId !== this.requestSequence) {
        return;
      }

      this.processes.set(response.items);
      this.totalLength.set(response.total);

      const selectedId = this.selectedProcessId();
      if (selectedId != null) {
        const refreshed = response.items.find((item) => item.id === selectedId);
        if (refreshed) {
          this.selectedProcess.set(refreshed);
          if (this.viewMode() === 'details') {
            this.form.set(this.formFactory.fromRecord(refreshed));
          }
        }
      }
    } finally {
      if (requestId === this.requestSequence) {
        this.loading.set(false);
      }
    }
  }

  private scheduleSearchReload(): void {
    this.clearSearchDebounce();
    this.searchDebounceHandle = setTimeout(() => {
      this.searchDebounceHandle = null;
      void this.loadProcesses(true);
    }, this.searchDebounceMs);
  }

  private clearSearchDebounce(): void {
    if (this.searchDebounceHandle != null) {
      clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }
  }
}
