import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppFeedbackService, AuthService } from '@integration-hub/core/services';
import { ProcessApiService } from './process-api.service';
import { ProcessFlowApiService } from './process-flow-api.service';
import { ProcessFlowNodePosition } from './process-flow.models';
import { ProcessFlowMapper } from './process-flow.mapper';
import { ProcessFlowSyncService } from './process-flow-sync.service';
import {
  createProcessForm,
  createTaskForm,
  normalizeTaskOrders,
  ProcessFormModel,
  ProcessRecord,
  ProcessTaskFormModel,
  ProcessTaskType,
  toProcessFormModel,
} from './process.models';

type ViewMode = 'details' | 'edit';
type ScheduleFilter = 'ALL' | 'MANUAL' | 'SCHEDULED';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Injectable()
export class ProcessCatalogStore {
  private readonly api = inject(ProcessApiService);
  private readonly auth = inject(AuthService);
  private readonly feedback = inject(AppFeedbackService);
  private readonly flowApi = inject(ProcessFlowApiService);
  private readonly flowMapper = new ProcessFlowMapper();
  private readonly flowSync = new ProcessFlowSyncService(this.flowMapper);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly executing = signal(false);
  readonly processes = signal<ProcessRecord[]>([]);
  readonly sources = signal<any[]>([]);
  readonly readers = signal<any[]>([]);
  readonly connections = signal<any[]>([]);
  readonly search = signal('');
  readonly scheduleFilter = signal<ScheduleFilter>('ALL');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly selectedProcessId = signal<number | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);
  readonly viewMode = signal<ViewMode>('details');
  readonly form = signal<ProcessFormModel>(createProcessForm());

  readonly canEdit = computed(() => this.auth.canAdmin());
  readonly canOperate = computed(() => this.auth.hasAnyRole(['platform-admin', 'integration-admin', 'operator']));

  readonly filteredProcesses = computed(() => {
    const search = this.search().trim().toLowerCase();
    const scheduleFilter = this.scheduleFilter();
    const statusFilter = this.statusFilter();
    return this.processes().filter((process) => {
      const matchesSearch =
        !search ||
        process.name.toLowerCase().includes(search) ||
        process.description.toLowerCase().includes(search) ||
        String(process.id).includes(search);
      const matchesSchedule =
        scheduleFilter === 'ALL' ||
        (scheduleFilter === 'SCHEDULED' && process.scheduled) ||
        (scheduleFilter === 'MANUAL' && !process.scheduled);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && process.active) ||
        (statusFilter === 'INACTIVE' && !process.active);
      return matchesSearch && matchesSchedule && matchesStatus;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredProcesses().length / this.pageSize())));

  readonly pagedProcesses = computed(() => {
    const pageIndex = Math.min(this.currentPage(), this.totalPages() - 1);
    const size = this.pageSize();
    const start = pageIndex * size;
    return this.filteredProcesses().slice(start, start + size);
  });

  readonly selectedProcess = computed(() => this.processes().find((item) => item.id === this.selectedProcessId()) ?? null);
  readonly formTitle = computed(() => this.viewMode() === 'edit' ? (this.form().id ? 'processes.edit' : 'processes.create') : 'processes.detail');

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [processes, sources, readers, connections] = await Promise.all([
        firstValueFrom(this.api.list()),
        firstValueFrom(this.api.listSources()),
        firstValueFrom(this.api.listReaders()),
        firstValueFrom(this.api.listConnections()),
      ]);
      this.processes.set(processes);
      this.sources.set(sources);
      this.readers.set(readers);
      this.connections.set(connections);
      const selectedId = this.selectedProcessId();
      if (selectedId != null) {
        const selected = processes.find((item) => item.id === selectedId);
        if (selected) {
          this.form.set(toProcessFormModel(selected));
        }
      }
      this.currentPage.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  selectProcess(process: ProcessRecord): void {
    this.selectedProcessId.set(process.id);
    this.form.set(toProcessFormModel(process));
    this.viewMode.set('details');
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(Math.max(0, Math.min(pageIndex, Math.ceil(this.filteredProcesses().length / pageSize) - 1 || 0)));
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(0);
  }

  updateScheduleFilter(value: ScheduleFilter): void {
    this.scheduleFilter.set(value);
    this.currentPage.set(0);
  }

  updateStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.currentPage.set(0);
  }

  startCreate(): void {
    this.form.set(createProcessForm());
    this.viewMode.set('edit');
    this.drawerOpen.set(true);
  }

  startEdit(process: ProcessRecord): void {
    this.selectedProcessId.set(process.id);
    this.form.set(toProcessFormModel(process));
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
      scheduleEvery: patch.scheduled === false ? '' : (patch.scheduleEvery ?? current.scheduleEvery),
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
      const tasks = normalizeTaskOrders([...current.tasks, createTaskForm(taskType, current.tasks.length + 1)]);
      const nextTask = tasks[tasks.length - 1];
      const flowLayout = this.flowApi.addTaskNode(current.flowLayout, nextTask, tasks.length, position, current.tasks);
      return {
        ...current,
        tasks: this.flowSync.synchronizeTasks(flowLayout, tasks),
        flowLayout,
      };
    });
  }

  updateTask(clientId: string, patch: Partial<ProcessTaskFormModel>): void {
    this.form.update((current) => {
      const tasks = normalizeTaskOrders(current.tasks.map((task) => {
        if (task.clientId !== clientId) return task;
        const nextType = (patch.taskType ?? task.taskType) as ProcessTaskType;
        return {
          ...task,
          ...patch,
          configurationJson: patch.taskType && patch.taskType !== task.taskType
            ? createTaskForm(nextType, task.taskOrder).configurationJson
            : (patch.configurationJson ?? task.configurationJson),
          sourceDefinitionId: nextType === 'FILE_READ' ? (patch.sourceDefinitionId ?? task.sourceDefinitionId) : null,
          readerDefinitionId: nextType === 'FILE_READ' ? (patch.readerDefinitionId ?? task.readerDefinitionId) : null,
        };
      }));
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
      const tasks = normalizeTaskOrders(current.tasks.filter((task) => task.clientId !== clientId));
      const flowLayout = this.flowSync.removeTask(this.flowSync.synchronizeLayout(current.flowLayout, tasks), clientId);
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
          sourceDefinitionId: task.taskType === 'FILE_READ' ? task.sourceDefinitionId : null,
          readerDefinitionId: task.taskType === 'FILE_READ' ? task.readerDefinitionId : null,
          configurationJson: task.configurationJson?.trim() || '{}',
        })),
      };
      const saved = form.id
        ? await firstValueFrom(this.api.update(form.id, payload))
        : await firstValueFrom(this.api.create(payload));

      await this.load();
      this.selectedProcessId.set(saved.id);
      this.viewMode.set('details');
      this.drawerOpen.set(true);
      this.feedback[form.id ? 'updated' : 'created']('entities.process');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(process: ProcessRecord): Promise<void> {
    await firstValueFrom(this.api.setActive(process.id, !process.active));
    await this.load();
    this.selectedProcessId.set(process.id);
    this.drawerOpen.set(true);
    this.feedback[process.active ? 'deactivated' : 'activated']('entities.process');
  }

  async execute(process: ProcessRecord): Promise<void> {
    this.executing.set(true);
    try {
      await firstValueFrom(this.api.execute(process.id));
      this.feedback.info('processes.executed');
      await this.load();
      this.selectedProcessId.set(process.id);
      this.drawerOpen.set(true);
    } finally {
      this.executing.set(false);
    }
  }
}
