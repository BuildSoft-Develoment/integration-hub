import { computed, inject, Injectable, signal } from '@angular/core';

import { ReaderDraft, ReaderProviderType } from '@integration-hub/core/providers';
import { AuthAccessService } from '@integration-hub/core/services';

import { ReaderCatalogCommandService } from './reader-catalog-command.service';
import { ReaderCatalogQueryStore } from './reader-catalog-query.store';
import { ReaderEditorStateService } from './reader-editor-state.service';
import { ReaderFormModel, ReaderRecord } from './reader.models';

@Injectable()
export class ReaderCatalogStore {
  private readonly editor = inject(ReaderEditorStateService);
  private readonly query = inject(ReaderCatalogQueryStore);
  private readonly commands = inject(ReaderCatalogCommandService);
  private readonly access = inject(AuthAccessService);

  readonly saving = signal(false);
  readonly loading = this.query.loading;
  readonly readers = this.query.readers;
  readonly totalLength = this.query.totalLength;
  readonly search = this.query.search;
  readonly typeFilter = this.query.typeFilter;
  readonly selectedReaderId = this.query.selectedReaderId;
  readonly selectedReader = this.query.selectedReader;
  readonly drawerOpen = this.query.drawerOpen;
  readonly currentPage = this.query.currentPage;
  readonly pageSize = this.query.pageSize;
  readonly viewMode = this.editor.viewMode;
  readonly form = this.editor.form;
  readonly draft = this.editor.draft;

  readonly canEdit = computed(() => this.access.canAdmin());
  readonly pagedReaders = this.query.pagedReaders;

  readonly selectedForm = computed<ReaderFormModel>(() =>
    this.editor.resolveSelectedForm(this.selectedReader())
  );

  readonly selectedDraft = computed<ReaderDraft>(() =>
    this.editor.resolveSelectedDraft(this.selectedReader())
  );

  readonly formTitle = this.editor.formTitle;

  async load(): Promise<void> {
    await this.query.load();
  }

  selectReader(reader: ReaderRecord): void {
    this.query.selectReader(reader);
    this.editor.showDetails();
  }

  closeDrawer(): void {
    this.query.closeDrawer();
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.query.updatePagination(pageIndex, pageSize);
  }

  updateSearch(value: string): void {
    this.query.updateSearch(value);
  }

  updateTypeFilter(value: 'ALL' | ReaderProviderType): void {
    this.query.updateTypeFilter(value);
  }

  startCreate(): void {
    const readerType = this.form().readerType || 'TXT';
    this.editor.startCreate(readerType);
    this.query.openDrawer();
  }

  startEdit(reader: ReaderRecord): void {
    this.query.markSelectedReader(reader);
    this.editor.startEdit(reader);
    this.query.openDrawer();
  }

  cancelEdit(): void {
    this.query.closeDrawer();
    this.editor.cancelEdit();
  }

  updateFormField<K extends keyof ReaderFormModel>(
    field: K,
    value: ReaderFormModel[K]
  ): void {
    this.editor.updateFormField(field, value);
  }

  patchForm(patch: Partial<ReaderFormModel>): void {
    this.editor.patchForm(patch);
  }

  updateDraft(patch: Partial<ReaderDraft>): void {
    this.editor.updateDraft(patch);
  }

  async save(): Promise<void> {
    this.saving.set(true);
    try {
      await this.commands.save();
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(reader: ReaderRecord): Promise<void> {
    await this.commands.toggleActive(reader);
  }
}
