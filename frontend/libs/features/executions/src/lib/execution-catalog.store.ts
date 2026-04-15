import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppFeedbackService, UiMessageService } from '@integration-hub/core/services';
import { ExecutionApiService, ExecutionModeFilter } from './execution-api.service';
import { ExecutionDetailLoaderService } from './execution-detail-loader.service';
import { ExecutionFileActionService } from './execution-file-action.service';
import { ExecutionNavigationService } from './execution-navigation.service';
import {
  ExecutionFileActionRequest,
  ProcessExecutionRecord,
  ProcessTaskExecutionRecord,
} from './execution.models';

type StatusFilter = 'ALL' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'COMPLETED_WITH_ERRORS';

@Injectable()
export class ExecutionCatalogStore implements OnDestroy {
  private readonly api = inject(ExecutionApiService);
  private readonly detailLoader = inject(ExecutionDetailLoaderService);
  private readonly fileActions = inject(ExecutionFileActionService);
  private readonly navigation = inject(ExecutionNavigationService);
  private readonly feedback = inject(AppFeedbackService);
  private readonly uiMessage = inject(UiMessageService);
  private readonly searchDebounceMs = 300;
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private requestSequence = 0;

  readonly loading = signal(false);
  readonly loadingDetails = signal(false);
  readonly actionRunning = signal(false);
  readonly executions = signal<ProcessExecutionRecord[]>([]);
  readonly totalLength = signal(0);
  readonly tasks = signal<ProcessTaskExecutionRecord[]>([]);
  readonly children = signal<ProcessExecutionRecord[]>([]);
  readonly search = signal('');
  readonly modeFilter = signal<ExecutionModeFilter>('ALL');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly selectedExecutionId = signal<number | null>(null);
  readonly selectedExecution = signal<ProcessExecutionRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);
  readonly navigationStack = this.navigation.navigationStack;

  readonly pagedExecutions = computed(() => this.executions());

  async load(): Promise<void> {
    await this.loadExecutions(true);
  }

  ngOnDestroy(): void {
    this.clearSearchDebounce();
  }

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

  updateSearch(value: string): void {
    this.search.set(value);
    this.scheduleSearchReload();
  }

  updateModeFilter(value: ExecutionModeFilter): void {
    this.modeFilter.set(value);
    this.clearSearchDebounce();
    void this.loadExecutions(true);
  }

  updateStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.clearSearchDebounce();
    void this.loadExecutions(true);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.clearSearchDebounce();
    this.pageSize.set(pageSize);
    this.currentPage.set(pageIndex);
    void this.loadExecutions(false);
  }

  async runFileAction(request: ExecutionFileActionRequest): Promise<void> {
    const execution = this.selectedExecution();
    if (!execution?.processDefinitionId) {
      return;
    }

    const selectedFiles = this.fileActions.selectedFileReferences(request);
    if (!selectedFiles.length) {
      return;
    }

    this.actionRunning.set(true);
    try {
      const result = await firstValueFrom(
        this.api.execute(execution.processDefinitionId, {
          selectedFiles,
          sourceExecutionId: execution.id,
        })
      );

      this.uiMessage.show({
        kind: 'success',
        message: this.fileActions.successMessage(request.kind, result.id),
      });

      await this.loadExecutions(false);
      await this.loadExecutionDetails(execution.id, { openDrawer: true });
    } catch (error) {
      this.feedback.handleHttpError(error as never);
    } finally {
      this.actionRunning.set(false);
    }
  }

  private async loadExecutions(resetPage: boolean): Promise<void> {
    if (resetPage) {
      this.currentPage.set(0);
    }

    const requestId = ++this.requestSequence;
    this.loading.set(true);
    try {
      const status = this.statusFilter() === 'ALL' ? null : this.statusFilter();
      const response = await firstValueFrom(
        this.api.list({
          status,
          search: this.search(),
          mode: this.modeFilter(),
          page: this.currentPage(),
          size: this.pageSize(),
        })
      );

      if (requestId !== this.requestSequence) {
        return;
      }

      this.executions.set(response.items);
      this.totalLength.set(response.total);

      const selectedId = this.selectedExecutionId();
      if (selectedId != null) {
        const refreshed = response.items.find((item) => item.id === selectedId);
        if (refreshed) {
          this.selectedExecution.set(refreshed);
        }
      }
    } finally {
      if (requestId === this.requestSequence) {
        this.loading.set(false);
      }
    }
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
      this.executions.update((current) =>
        current.some((item) => item.id === detail.id)
          ? current.map((item) => (item.id === detail.id ? detail : item))
          : current
      );
      this.tasks.set(tasks);
      this.children.set(children);
    } finally {
        this.loadingDetails.set(false);
    }
  }

  private scheduleSearchReload(): void {
    this.clearSearchDebounce();
    this.searchDebounceHandle = setTimeout(() => {
      this.searchDebounceHandle = null;
      void this.loadExecutions(true);
    }, this.searchDebounceMs);
  }

  private clearSearchDebounce(): void {
    if (this.searchDebounceHandle != null) {
      clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }
  }
}
