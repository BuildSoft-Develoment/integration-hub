import { inject, Injectable } from '@angular/core';

import { ExecutionModeFilter } from '../api/execution-api.service';
import { ExecutionCatalogCommandService } from './execution-catalog-command.service';
import {
  ExecutionCatalogQueryStore,
  ExecutionStatusFilter,
} from './execution-catalog-query.store';
import { ExecutionDetailStore } from '../details/execution-detail.store';
import {
  ExecutionFileActionRequest,
  ProcessExecutionRecord,
} from '../models/execution.models';

@Injectable()
export class ExecutionCatalogStore {
  private readonly commands = inject(ExecutionCatalogCommandService);
  private readonly detail = inject(ExecutionDetailStore);
  private readonly query = inject(ExecutionCatalogQueryStore);

  readonly loading = this.query.loading;
  readonly loadingDetails = this.detail.loadingDetails;
  readonly actionRunning = this.detail.actionRunning;
  readonly executions = this.query.executions;
  readonly totalLength = this.query.totalLength;
  readonly tasks = this.detail.tasks;
  readonly children = this.detail.children;
  readonly search = this.query.search;
  readonly modeFilter = this.query.modeFilter;
  readonly statusFilter = this.query.statusFilter;
  readonly selectedExecutionId = this.detail.selectedExecutionId;
  readonly selectedExecution = this.detail.selectedExecution;
  readonly drawerOpen = this.detail.drawerOpen;
  readonly currentPage = this.query.currentPage;
  readonly pageSize = this.query.pageSize;
  readonly navigationStack = this.detail.navigationStack;
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

  updatePagination(pageIndex: number, pageSize: number): void {
    this.query.updatePagination(pageIndex, pageSize);
  }

  async runFileAction(request: ExecutionFileActionRequest): Promise<void> {
    await this.commands.runFileAction(request);
  }
}
