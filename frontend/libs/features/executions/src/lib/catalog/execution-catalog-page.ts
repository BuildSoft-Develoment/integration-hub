import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';

import { ExecutionModeFilter } from '../api/execution-api.service';
import { ExecutionCatalogCommandService } from './execution-catalog-command.service';
import { ExecutionCatalogQueryStore } from './execution-catalog-query.store';
import { ExecutionCatalogStore } from './execution-catalog.store';
import { ExecutionDetailLoaderService } from '../details/execution-detail-loader.service';
import { ExecutionDetailStore } from '../details/execution-detail.store';
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
    ExecutionNavigationService,
    ExecutionDetailLoaderService,
    ExecutionFileActionService,
  ],
  imports: [
    CommonModule,
    MatSidenavModule,
    ExecutionToolbarComponent,
    ExecutionListComponent,
    ExecutionEditorComponent,
  ],
  templateUrl: './execution-catalog-page.html',
  styleUrl: './execution-catalog-page.css',
})
export class ExecutionCatalogPageComponent implements OnInit {
  readonly store = inject(ExecutionCatalogStore);
  readonly viewModel = computed(() => ({
    toolbar: {
      search: this.store.search(),
      modeFilter: this.store.modeFilter(),
      statusFilter: this.store.statusFilter(),
    },
    list: {
      executions: this.store.pagedExecutions(),
      totalLength: this.store.totalLength(),
      selectedExecutionId: this.store.selectedExecution()?.id ?? null,
      pageIndex: this.store.currentPage(),
      pageSize: this.store.pageSize(),
    },
    editor: {
      execution: this.store.selectedExecution(),
      tasks: this.store.tasks(),
      children: this.store.children(),
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

  selectExecution(execution: ProcessExecutionRecord): void {
    void this.store.selectExecution(execution);
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
}
