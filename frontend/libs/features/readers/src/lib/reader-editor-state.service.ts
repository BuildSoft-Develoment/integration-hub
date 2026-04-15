import { computed, inject, Injectable, signal } from '@angular/core';
import { ReaderDraft, ReaderProviderType } from '@integration-hub/core/providers';
import { ReaderManagerService } from '@integration-hub/core/services';
import {
  createReaderForm,
  ReaderFormModel,
  ReaderRecord,
  toReaderFormModel,
} from './reader.models';

type ReaderViewMode = 'details' | 'edit';

@Injectable()
export class ReaderEditorStateService {
  private readonly readerManager = inject(ReaderManagerService);

  readonly viewMode = signal<ReaderViewMode>('details');
  readonly form = signal<ReaderFormModel>(createReaderForm('TXT'));
  readonly draft = signal<ReaderDraft>(this.readerManager.createDraftFor('TXT'));

  readonly formTitle = computed(() =>
    this.viewMode() === 'edit'
      ? this.form().id
        ? 'readers.edit'
        : 'readers.create'
      : 'readers.detail'
  );

  showDetails(): void {
    this.viewMode.set('details');
  }

  startCreate(readerType: ReaderProviderType): void {
    this.form.set(createReaderForm(readerType));
    this.draft.set(this.readerManager.createDraftFor(readerType));
    this.viewMode.set('edit');
  }

  startEdit(reader: ReaderRecord): void {
    this.form.set(toReaderFormModel(reader));
    this.draft.set(
      this.readerManager.hydrateDraft(reader.readerType, reader.configurationJson)
    );
    this.viewMode.set('edit');
  }

  cancelEdit(): void {
    this.viewMode.set('details');
  }

  updateFormField<K extends keyof ReaderFormModel>(
    field: K,
    value: ReaderFormModel[K]
  ): void {
    this.form.update((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === 'readerType') {
      this.draft.set(this.readerManager.createDraftFor(value as ReaderProviderType));
    }
  }

  patchForm(patch: Partial<ReaderFormModel>): void {
    this.form.update((current) => ({
      ...current,
      ...patch,
    }));
  }

  updateDraft(patch: Partial<ReaderDraft>): void {
    this.draft.update((current) => ({
      ...current,
      ...patch,
    }));
  }

  resolveSelectedForm(selectedReader: ReaderRecord | null): ReaderFormModel {
    if (!selectedReader) {
      return createReaderForm(this.form().readerType || 'TXT');
    }

    return toReaderFormModel(selectedReader);
  }

  resolveSelectedDraft(selectedReader: ReaderRecord | null): ReaderDraft {
    if (!selectedReader) {
      return this.readerManager.createDraftFor(
        this.resolveSelectedForm(selectedReader).readerType
      );
    }

    return this.readerManager.hydrateDraft(
      selectedReader.readerType,
      selectedReader.configurationJson
    );
  }
}
