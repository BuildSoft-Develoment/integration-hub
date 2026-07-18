import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';

import { ExecutionModeFilter } from '../api/execution-api.service';
import { ExecutionCatalogCommandService } from './execution-catalog-command.service';
import { ExecutionCatalogQueryStore } from './execution-catalog-query.store';
import { ExecutionCatalogStore } from './execution-catalog.store';
import { ExecutionDetailLoaderService } from '../details/execution-detail-loader.service';
import { ExecutionDetailStore } from '../details/execution-detail.store';
import { ExecutionProgressPoller } from '../details/execution-progress-poller';
import { ExecutionFileActionService } from '../details/execution-file-action.service';
import { ExecutionNavigationService } from '../details/execution-navigation.service';
import {
  ExecutionFileActionRequest,
  ProcessExecutionRecord,
} from '../models/execution.models';
import { ExecutionEditorComponent } from '../components/execution-editor/execution-editor.component';
import { ExecutionListComponent } from '../components/execution-list/execution-list.component';
import { ExecutionToolbarComponent } from '../components/execution-toolbar/execution-toolbar.component';

@Component({
  selector: 'ih-execution-catalog-page',
  standalone: true,
  providers: [
    ExecutionCatalogStore,
    ExecutionCatalogCommandService,
    ExecutionCatalogQueryStore,
    ExecutionDetailStore,
    ExecutionProgressPoller,
    ExecutionNavigationService,
    ExecutionDetailLoaderService,
    ExecutionFileActionService,
  ],
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatSidenavModule,
    ExecutionToolbarComponent,
    ExecutionListComponent,
    ExecutionEditorComponent,
  ],
  templateUrl: './execution-catalog-page.html',
  styleUrl: './execution-catalog-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionCatalogPageComponent implements OnInit {
  readonly store = inject(ExecutionCatalogStore);
  readonly viewModel = computed(() => ({
    loading: this.store.loading(),
    error: this.store.error(),
    toolbar: {
      search: this.store.search(),
      modeFilter: this.store.modeFilter(),
      statusFilter: this.store.statusFilter(),
      startedFrom: this.store.startedFrom(),
      startedTo: this.store.startedTo(),
      loading: this.store.loading(),
    },
    list: {
      executions: this.store.pagedExecutions(),
      totalLength: this.store.totalLength(),
      selectedExecutionId: this.store.selectedExecution()?.id ?? null,
      sortField: this.store.sortField(),
      sortDirection: this.store.sortDirection(),
      pageIndex: this.store.currentPage(),
      pageSize: this.store.pageSize(),
    },
    editor: {
      execution: this.store.selectedExecution(),
      tasks: this.store.tasks(),
      children: this.store.children(),
      progress: this.store.progress(),
      navigationStack: this.store.navigationStack(),
      loading: this.store.loadingDetails(),
      actionBusy: this.store.actionRunning(),
      opened: this.store.drawerOpen(),
    },
  }));

  ngOnInit(): void {
    void this.store.load();
  }

  updateSearch(value: string): void {
    this.store.updateSearch(value);
  }

  updateModeFilter(value: ExecutionModeFilter): void {
    this.store.updateModeFilter(value);
  }

  updateStatusFilter(
    value: 'ALL' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'COMPLETED_WITH_ERRORS'
  ): void {
    this.store.updateStatusFilter(value);
  }

  updateStartedFrom(value: string): void {
    this.store.updateDateFilter({ startedFrom: value });
  }

  updateStartedTo(value: string): void {
    this.store.updateDateFilter({ startedTo: value });
  }

  selectExecution(execution: ProcessExecutionRecord): void {
    void this.store.selectExecution(execution);
  }

  toggleSort(field: string): void {
    this.store.toggleSort(field);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.store.updatePagination(pageIndex, pageSize);
  }

  closeDrawer(): void {
    this.store.closeDrawer();
  }

  openExecution(executionId: number): void {
    void this.store.openRelatedExecution(executionId);
  }

  goBack(): void {
    void this.store.goBackToPreviousExecution();
  }

  runFileAction(request: ExecutionFileActionRequest): void {
    void this.store.runFileAction(request);
  }

  refresh(): void {
    void this.store.load();
  }
}
