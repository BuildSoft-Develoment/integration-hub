import { computed, inject, Injectable, signal } from '@angular/core';

import { SourceDraft, SourceProviderType } from '@integration-hub/core/providers';
import {
  AppFeedbackService,
  AuthAccessService,
  SourceManagerService,
} from '@integration-hub/core/services';

import { SourceCatalogCommandService } from './source-catalog-command.service';
import {
  SourceCatalogQueryStore,
  SourceStatusFilter,
} from './source-catalog-query.store';
import { SourceEditorStateService } from '../editor/source-editor-state.service';
import { SourceDirection, SourceFormModel, SourceRecord } from '../models/source.models';

@Injectable()
export class SourceCatalogStore {
  private readonly sourceManager = inject(SourceManagerService);
  private readonly editor = inject(SourceEditorStateService);
  private readonly query = inject(SourceCatalogQueryStore);
  private readonly commands = inject(SourceCatalogCommandService);
  private readonly access = inject(AuthAccessService);

  readonly saving = signal(false);
  readonly testing = signal(false);
  readonly loading = this.query.loading;
  readonly error = this.query.error;
  readonly sources = this.query.sources;
  readonly totalLength = this.query.totalLength;
  readonly search = this.query.search;
  readonly typeFilter = this.query.typeFilter;
  readonly statusFilter = this.query.statusFilter;
  readonly directionFilter = this.query.directionFilter;
  readonly selectedSourceId = this.query.selectedSourceId;
  readonly selectedSource = this.query.selectedSource;
  readonly sortField = this.query.sortField;
  readonly sortDirection = this.query.sortDirection;
  readonly drawerOpen = this.query.drawerOpen;
  readonly currentPage = this.query.currentPage;
  readonly pageSize = this.query.pageSize;
  readonly viewMode = this.editor.viewMode;
  readonly testResult = this.editor.testResult;
  readonly form = this.editor.form;
  readonly draft = this.editor.draft;
  readonly dirty = this.editor.dirty;

  readonly canEdit = computed(() => this.access.canAdmin());
  readonly pagedSources = this.query.pagedSources;

  readonly activeProvider = computed(() =>
    this.sourceManager.resolve(
      this.viewMode() === 'edit'
        ? this.form().sourceType
        : this.selectedForm().sourceType
    )
  );

  readonly selectedForm = computed<SourceFormModel>(() =>
    this.editor.resolveSelectedForm(this.selectedSource())
  );

  readonly selectedDraft = computed<SourceDraft>(() =>
    this.editor.resolveSelectedDraft(this.selectedSource())
  );

  readonly formTitle = this.editor.formTitle;

  async load(): Promise<void> {
    await this.query.load();
  }

  selectSource(source: SourceRecord): void {
    this.query.selectSource(source);
    this.editor.showDetails();
    this.editor.clearTestResult();
  }

  closeDrawer(): void {
    this.query.closeDrawer();
    this.editor.clearTestResult();
  }

  previousPage(): void {
    this.updatePagination(Math.max(0, this.currentPage() - 1), this.pageSize());
  }

  nextPage(): void {
    this.updatePagination(this.currentPage() + 1, this.pageSize());
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.query.updatePagination(pageIndex, pageSize);
  }

  updateSearch(value: string): void {
    this.query.updateSearch(value);
  }

  updateTypeFilter(value: 'ALL' | SourceProviderType): void {
    this.query.updateTypeFilter(value);
  }

  updateDirectionFilter(value: 'ALL' | SourceDirection): void {
    this.query.updateDirectionFilter(value);
  }

  updateStatusFilter(value: SourceStatusFilter): void {
    this.query.updateStatusFilter(value);
  }

  toggleSort(field: string): void {
    this.query.toggleSort(field);
  }

  startCreate(): void {
    const sourceType = this.form().sourceType || 'FILESYSTEM';
    this.editor.startCreate(sourceType);
    this.query.openDrawer();
  }

  startEdit(source: SourceRecord): void {
    this.query.markSelectedSource(source);
    this.editor.startEdit(source);
    this.query.openDrawer();
  }

  cancelEdit(): void {
    this.query.closeDrawer();
    this.editor.cancelEdit();
  }

  updateFormField<K extends keyof SourceFormModel>(
    field: K,
    value: SourceFormModel[K]
  ): void {
    this.editor.updateFormField(field, value);
  }

  updateDraft(patch: Partial<SourceDraft>): void {
    this.editor.updateDraft(patch);
  }

  patchForm(patch: Partial<SourceFormModel>): void {
    this.editor.patchForm(patch);
  }

  async save(): Promise<void> {
    this.saving.set(true);
    try {
      await this.commands.save();
    } finally {
      this.saving.set(false);
    }
  }

  async testSource(): Promise<void> {
    this.testing.set(true);
    try {
      await this.commands.testSource();
    } finally {
      this.testing.set(false);
    }
  }

  async toggleActive(source: SourceRecord): Promise<void> {
    await this.commands.toggleActive(source);
  }
}
