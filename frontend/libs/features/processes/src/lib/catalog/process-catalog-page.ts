import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { providePaymentsSwiftForms, provideProcessTaskProviders } from '@integration-hub/core/providers';
import { provideMotorProcessForms } from '../processes.providers';
import { ProcessMt101ArchiveTaskFormComponent } from '../components/process-task-form/process-mt101-archive-task-form/process-mt101-archive-task-form.component';
import { ProcessMt101BuildTaskFormComponent } from '../components/process-task-form/process-mt101-build-task-form/process-mt101-build-task-form.component';
import { ProcessMt101ParseTaskFormComponent } from '../components/process-task-form/process-mt101-parse-task-form/process-mt101-parse-task-form.component';
import { ProcessMt101PayTaskFormComponent } from '../components/process-task-form/process-mt101-pay-task-form/process-mt101-pay-task-form.component';
import { ProcessMt101ReconcileTaskFormComponent } from '../components/process-task-form/process-mt101-reconcile-task-form/process-mt101-reconcile-task-form.component';
import { ProcessMt101RepairTaskFormComponent } from '../components/process-task-form/process-mt101-repair-task-form/process-mt101-repair-task-form.component';
import { ProcessMt101RouteTaskFormComponent } from '../components/process-task-form/process-mt101-route-task-form/process-mt101-route-task-form.component';
import { ProcessMt101SplitTaskFormComponent } from '../components/process-task-form/process-mt101-split-task-form/process-mt101-split-task-form.component';
import { ProcessMt101StatusTaskFormComponent } from '../components/process-task-form/process-mt101-status-task-form/process-mt101-status-task-form.component';
import { ProcessMt101ValidateTaskFormComponent } from '../components/process-task-form/process-mt101-validate-task-form/process-mt101-validate-task-form.component';
import { ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessCatalogStore } from './process-catalog.store';
import { ProcessCatalogCommandService } from './process-catalog-command.service';
import { ProcessCatalogQueryStore } from './process-catalog-query.store';
import { ProcessEditorStore } from '../editor/process-editor.store';
import { ProcessFlowApiService } from '../api/process-flow-api.service';
import { ProcessFlowLayout } from '../models/process-flow.models';
import { ProcessReferenceStore } from '../references/process-reference.store';
import {
  ProcessFormModel,
  ProcessRecord,
  ProcessTaskFormModel,
  ProcessTaskType,
} from '../models/process.models';
import { ProcessEditorComponent } from '../components/process-editor/process-editor.component';
import { ProcessListComponent } from '../components/process-list/process-list.component';
import { ProcessToolbarComponent } from '../components/process-toolbar/process-toolbar.component';

@Component({
  selector: 'ih-process-catalog-page',
  standalone: true,
  providers: [
    ProcessCatalogStore,
    ProcessCatalogCommandService,
    ProcessCatalogQueryStore,
    ProcessEditorStore,
    ProcessReferenceStore,
    ProcessTaskManagerService,
    ProcessFlowApiService,
    // Task providers (serializacion config_json) del motor y verticales.
    ...provideProcessTaskProviders(),
    // M-1b: registracion de formularios del motor (FILE_READ + 5 DB/HTTP/notif).
    ...provideMotorProcessForms(),
    // Vertical 008 mensajeria de pagos - sub-catalogo swift/ (10 task types tras sprint 3).
    ...providePaymentsSwiftForms({
      mt101Build: ProcessMt101BuildTaskFormComponent,
      mt101Validate: ProcessMt101ValidateTaskFormComponent,
      mt101Archive: ProcessMt101ArchiveTaskFormComponent,
      mt101Pay: ProcessMt101PayTaskFormComponent,
      mt101Route: ProcessMt101RouteTaskFormComponent,
      mt101Reconcile: ProcessMt101ReconcileTaskFormComponent,
      mt101Status: ProcessMt101StatusTaskFormComponent,
      mt101Parse: ProcessMt101ParseTaskFormComponent,
      mt101Split: ProcessMt101SplitTaskFormComponent,
      mt101Repair: ProcessMt101RepairTaskFormComponent,
    }),
  ],
  imports: [CommonModule, MatSidenavModule, ProcessToolbarComponent, ProcessListComponent, ProcessEditorComponent],
  templateUrl: './process-catalog-page.html',
  styleUrl: './process-catalog-page.css',
})
export class ProcessCatalogPageComponent implements OnInit {
  readonly store = inject(ProcessCatalogStore);
  readonly viewModel = computed(() => ({
    drawerOpen: this.store.drawerOpen(),
    toolbar: {
      search: this.store.search(),
      scheduleFilter: this.store.scheduleFilter(),
      statusFilter: this.store.statusFilter(),
      canEdit: this.store.canEdit(),
    },
    list: {
      processes: this.store.pagedProcesses(),
      totalLength: this.store.totalLength(),
      selectedProcessId: this.store.selectedProcess()?.id ?? null,
      pageIndex: this.store.currentPage(),
      pageSize: this.store.pageSize(),
    },
    editor: {
      form: this.store.form(),
      sources: this.store.sources(),
      readers: this.store.readers(),
      connections: this.store.connections(),
      titleKey: this.store.formTitle(),
      saving: this.store.saving(),
      executing: this.store.executing(),
      readonly: this.store.viewMode() !== 'edit',
      canEdit: this.store.canEdit(),
      canOperate: this.store.canOperate(),
      selectedProcess: this.store.selectedProcess(),
    },
  }));

  ngOnInit(): void {
    void this.store.load();
  }

  createProcess(): void {
    void this.store.startCreate();
  }

  selectProcess(process: ProcessRecord): void {
    void this.store.selectProcess(process);
  }

  updateSearch(value: string): void {
    this.store.updateSearch(value);
  }

  updateScheduleFilter(value: 'ALL' | 'MANUAL' | 'SCHEDULED'): void {
    this.store.updateScheduleFilter(value);
  }

  updateStatusFilter(value: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.store.updateStatusFilter(value);
  }

  updatePagination(event: { pageIndex: number; pageSize: number }): void {
    this.store.updatePagination(event.pageIndex, event.pageSize);
  }

  patchForm(patch: Partial<ProcessFormModel>): void {
    this.store.patchForm(patch);
  }

  applyFlowLayout(layout: ProcessFlowLayout): void {
    this.store.applyFlowLayout(layout);
  }

  addTask(taskType: ProcessTaskType): void {
    this.store.addTask(taskType);
  }

  addTaskAt(event: {
    taskType: ProcessTaskType;
    position?: { x: number; y: number };
  }): void {
    this.store.addTaskAt(event.taskType, event.position);
  }

  applyMassiveTemplate(): void {
    this.store.applyMassiveMt101Template();
  }

  patchTask(event: {
    clientId: string;
    patch: Partial<ProcessTaskFormModel>;
  }): void {
    this.store.updateTask(event.clientId, event.patch);
  }

  applyFlowState(event: {
    layout: ProcessFlowLayout;
    tasks: ProcessTaskFormModel[];
  }): void {
    this.store.applyFlowState(event.layout, event.tasks);
  }

  removeTask(clientId: string): void {
    this.store.removeTask(clientId);
  }

  saveProcess(): void {
    void this.store.save();
  }

  cancelEdit(): void {
    this.store.cancelEdit();
  }

  closeDrawer(): void {
    this.store.closeDrawer();
  }

  editSelectedProcess(): void {
    const process = this.store.selectedProcess();
    if (process) {
      void this.store.startEdit(process);
    }
  }

  toggleSelectedProcess(): void {
    const process = this.store.selectedProcess();
    if (process) {
      void this.store.toggleActive(process);
    }
  }

  executeSelectedProcess(): void {
    const process = this.store.selectedProcess();
    if (process) {
      void this.store.execute(process);
    }
  }
}
