import { computed, inject, Injectable } from '@angular/core';
import { ProcessCatalogCommandService } from './process-catalog-command.service';
import { ProcessCatalogQueryStore } from './process-catalog-query.store';
import { ProcessEditorStore } from '../editor/process-editor.store';
import { ProcessFlowNodePosition } from '../models/process-flow.models';
import { ProcessReferenceStore } from '../references/process-reference.store';
import {
  ProcessFormModel,
  ProcessRecord,
  ProcessTaskFormModel,
  ProcessTaskType,
} from '../models/process.models';

@Injectable()
export class ProcessCatalogStore {
  private readonly commands = inject(ProcessCatalogCommandService);
  private readonly editor = inject(ProcessEditorStore);
  private readonly query = inject(ProcessCatalogQueryStore);
  private readonly references = inject(ProcessReferenceStore);

  readonly loading = this.query.loading;
  readonly error = this.query.error;
  readonly processes = this.query.processes;
  readonly totalLength = this.query.totalLength;
  readonly search = this.query.search;
  readonly scheduleFilter = this.query.scheduleFilter;
  readonly statusFilter = this.query.statusFilter;
  readonly sortField = this.query.sortField;
  readonly sortDirection = this.query.sortDirection;
  readonly currentPage = this.query.currentPage;
  readonly pageSize = this.query.pageSize;
  readonly referencesLoading = this.references.loading;
  readonly saving = this.editor.saving;
  readonly executing = this.editor.executing;
  readonly sources = this.references.sources;
  readonly readers = this.references.readers;
  readonly connections = this.references.connections;
  readonly selectedProcessId = this.editor.selectedProcessId;
  readonly selectedProcess = this.editor.selectedProcess;
  readonly drawerOpen = this.editor.drawerOpen;
  readonly viewMode = this.editor.viewMode;
  readonly form = this.editor.form;
  readonly dirty = this.editor.dirty;
  readonly canEdit = this.editor.canEdit;
  readonly canOperate = this.editor.canOperate;
  readonly pagedProcesses = computed(() => this.query.pagedProcesses());
  readonly formTitle = this.editor.formTitle;

  async load(): Promise<void> {
    await this.query.load();
  }

  async selectProcess(process: ProcessRecord): Promise<void> {
    await this.prepareEditor();
    this.editor.selectProcess(process);
  }

  closeDrawer(): void {
    this.editor.closeDrawer();
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.query.updatePagination(pageIndex, pageSize);
  }

  updateSearch(value: string): void {
    this.query.updateSearch(value);
  }

  updateScheduleFilter(value: 'ALL' | 'MANUAL' | 'SCHEDULED'): void {
    this.query.updateScheduleFilter(value);
  }

  updateStatusFilter(value: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.query.updateStatusFilter(value);
  }

  toggleSort(field: string): void {
    this.query.toggleSort(field);
  }

  async startCreate(): Promise<void> {
    await this.prepareEditor();
    this.editor.startCreate();
  }

  async startEdit(process: ProcessRecord): Promise<void> {
    await this.prepareEditor();
    this.editor.startEdit(process);
  }

  cancelEdit(): void {
    this.editor.cancelEdit();
  }

  patchForm(patch: Partial<ProcessFormModel>): void {
    this.editor.patchForm(patch);
  }

  applyFlowLayout(layout: ProcessFormModel['flowLayout']): void {
    this.editor.applyFlowLayout(layout);
  }

  applyFlowState(layout: ProcessFormModel['flowLayout'], tasks: ProcessTaskFormModel[]): void {
    this.editor.applyFlowState(layout, tasks);
  }

  addTask(taskType: ProcessTaskType = 'FILE_READ'): void {
    this.editor.addTask(taskType);
  }

  addTaskAt(taskType: ProcessTaskType, position?: ProcessFlowNodePosition): void {
    this.editor.addTaskAt(taskType, position);
  }

  applyMassiveMt101Template(): void {
    this.editor.applyMassiveMt101Template();
  }

  updateTask(clientId: string, patch: Partial<ProcessTaskFormModel>): void {
    this.editor.updateTask(clientId, patch);
  }

  removeTask(clientId: string): void {
    this.editor.removeTask(clientId);
  }

  async save(): Promise<void> {
    await this.commands.save();
  }

  async toggleActive(process: ProcessRecord): Promise<void> {
    await this.prepareEditor();
    await this.commands.toggleActive(process);
  }

  async execute(process: ProcessRecord): Promise<void> {
    await this.commands.execute(process);
  }

  private async prepareEditor(): Promise<void> {
    await this.references.ensureLoaded();
  }
}
