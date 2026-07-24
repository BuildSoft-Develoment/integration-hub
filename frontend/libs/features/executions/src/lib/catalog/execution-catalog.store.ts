import { inject, Injectable } from '@angular/core';

import { ExecutionModeFilter } from '../api/execution-api.service';
import { ExecutionCatalogCommandService } from './execution-catalog-command.service';
import {
  ExecutionCatalogQueryStore,
  ExecutionStatusFilter,
} from './execution-catalog-query.store';
import { ExecutionDetailStore } from '../details/execution-detail.store';
import { ExecutionProgressPoller } from '../details/execution-progress-poller';
import {
  ExecutionFileActionRequest,
  ProcessExecutionRecord,
} from '../models/execution.models';

@Injectable()
export class ExecutionCatalogStore {
  private readonly commands = inject(ExecutionCatalogCommandService);
  private readonly detail = inject(ExecutionDetailStore);
  private readonly query = inject(ExecutionCatalogQueryStore);
  // Arranca el scheduler del progreso en vivo (su effect observa el detail store). Se inyecta aquí
  // —el composition root del detalle— solo para instanciarlo; su lógica es autónoma.
  private readonly progressPoller = inject(ExecutionProgressPoller);

  readonly loading = this.query.loading;
  readonly error = this.query.error;
  readonly loadingDetails = this.detail.loadingDetails;
  readonly actionRunning = this.detail.actionRunning;
  readonly executions = this.query.executions;
  readonly totalLength = this.query.totalLength;
  readonly tasks = this.detail.tasks;
  readonly children = this.detail.children;
  readonly progress = this.detail.progress;
  readonly search = this.query.search;
  readonly modeFilter = this.query.modeFilter;
  readonly statusFilter = this.query.statusFilter;
  readonly startedFrom = this.query.startedFrom;
  readonly startedTo = this.query.startedTo;
  readonly selectedExecutionId = this.detail.selectedExecutionId;
  readonly selectedExecution = this.detail.selectedExecution;
  readonly drawerOpen = this.detail.drawerOpen;
  readonly currentPage = this.query.currentPage;
  readonly pageSize = this.query.pageSize;
  readonly navigationStack = this.detail.navigationStack;
  readonly sortField = this.query.sortField;
  readonly sortDirection = this.query.sortDirection;
  readonly pagedExecutions = this.query.pagedExecutions;

  async load(): Promise<void> {
    await this.query.load();
  }

  async selectExecution(execution: ProcessExecutionRecord): Promise<void> {
    await this.detail.selectExecution(execution);
  }

  async openRelatedExecution(executionId: number): Promise<void> {
    await this.detail.openRelatedExecution(executionId);
  }

  async goBackToPreviousExecution(): Promise<void> {
    await this.detail.goBackToPreviousExecution();
  }

  closeDrawer(): void {
    this.detail.closeDrawer();
  }

  updateSearch(value: string): void {
    this.query.updateSearch(value);
  }

  updateModeFilter(value: ExecutionModeFilter): void {
    this.query.updateModeFilter(value);
  }

  updateStatusFilter(value: ExecutionStatusFilter): void {
    this.query.updateStatusFilter(value);
  }

  updateDateFilter(patch: { startedFrom?: string; startedTo?: string }): void {
    this.query.updateDateFilter(patch);
  }

  clearFilters(): void {
    this.query.clearFilters();
  }

  toggleSort(field: string): void {
    this.query.toggleSort(field);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.query.updatePagination(pageIndex, pageSize);
  }

  async runFileAction(request: ExecutionFileActionRequest): Promise<void> {
    await this.commands.runFileAction(request);
  }
}
