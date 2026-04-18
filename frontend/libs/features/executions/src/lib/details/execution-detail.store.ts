import { inject, Injectable, signal } from '@angular/core';

import { ExecutionDetailLoaderService } from './execution-detail-loader.service';
import {
  ProcessExecutionRecord,
  ProcessTaskExecutionRecord,
} from '../models/execution.models';
import { ExecutionNavigationService } from './execution-navigation.service';

@Injectable()
export class ExecutionDetailStore {
  private readonly detailLoader = inject(ExecutionDetailLoaderService);
  private readonly navigation = inject(ExecutionNavigationService);

  readonly loadingDetails = signal(false);
  readonly actionRunning = signal(false);
  readonly tasks = signal<ProcessTaskExecutionRecord[]>([]);
  readonly children = signal<ProcessExecutionRecord[]>([]);
  readonly selectedExecutionId = signal<number | null>(null);
  readonly selectedExecution = signal<ProcessExecutionRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly navigationStack = this.navigation.navigationStack;

  async selectExecution(execution: ProcessExecutionRecord): Promise<void> {
    this.navigation.reset();
    await this.loadExecutionDetails(execution.id, { openDrawer: true });
  }

  async openRelatedExecution(executionId: number): Promise<void> {
    if (this.navigation.trimTo(executionId)) {
      await this.loadExecutionDetails(executionId, { openDrawer: true });
      return;
    }

    this.navigation.pushCurrentExecution(this.selectedExecution(), executionId);
    await this.loadExecutionDetails(executionId, { openDrawer: true });
  }

  async goBackToPreviousExecution(): Promise<void> {
    const previous = this.navigation.popPrevious();
    if (!previous) {
      return;
    }

    await this.loadExecutionDetails(previous.executionId, { openDrawer: true });
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  refreshSelectedExecution(execution: ProcessExecutionRecord): void {
    if (this.selectedExecutionId() !== execution.id) {
      return;
    }

    this.selectedExecution.set(execution);
  }

  markSelectedExecution(executionId: number): void {
    this.selectedExecutionId.set(executionId);
  }

  async reloadSelectedExecution(): Promise<void> {
    const executionId = this.selectedExecutionId();
    if (executionId == null) {
      return;
    }

    await this.loadExecutionDetails(executionId, { openDrawer: false });
  }

  private async loadExecutionDetails(
    executionId: number,
    options: { openDrawer: boolean }
  ): Promise<void> {
    this.selectedExecutionId.set(executionId);
    this.loadingDetails.set(true);
    if (options.openDrawer) {
      this.drawerOpen.set(true);
    }

    try {
      const { detail, tasks, children } = await this.detailLoader.load(executionId);
      this.selectedExecution.set(detail);
      this.tasks.set(tasks);
      this.children.set(children);
    } finally {
      this.loadingDetails.set(false);
    }
  }
}
