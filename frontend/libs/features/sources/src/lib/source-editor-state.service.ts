import { computed, inject, Injectable, signal } from '@angular/core';
import { SourceDraft, SourceProviderType } from '@integration-hub/core/providers';
import { SourceManagerService } from '@integration-hub/core/services';
import {
  createSourceForm,
  SourceFormModel,
  SourceRecord,
  SourceTestResult,
  toSourceFormModel,
} from './source.models';

type SourceViewMode = 'details' | 'edit';

@Injectable()
export class SourceEditorStateService {
  private readonly sourceManager = inject(SourceManagerService);

  readonly viewMode = signal<SourceViewMode>('details');
  readonly testResult = signal<SourceTestResult | null>(null);
  readonly form = signal<SourceFormModel>(createSourceForm('FILESYSTEM'));
  readonly draft = signal<SourceDraft>(this.sourceManager.createDraftFor('FILESYSTEM'));

  readonly formTitle = computed(() =>
    this.viewMode() === 'edit'
      ? this.form().id
        ? 'sources.edit'
        : 'sources.create'
      : 'sources.detail'
  );

  showDetails(): void {
    this.viewMode.set('details');
  }

  clearTestResult(): void {
    this.testResult.set(null);
  }

  startCreate(sourceType: SourceProviderType): void {
    this.form.set(createSourceForm(sourceType));
    this.draft.set(this.sourceManager.createDraftFor(sourceType));
    this.viewMode.set('edit');
    this.testResult.set(null);
  }

  startEdit(source: SourceRecord): void {
    this.form.set(toSourceFormModel(source));
    this.draft.set(
      this.sourceManager.hydrateDraft(source.sourceType, source.configurationJson)
    );
    this.viewMode.set('edit');
    this.testResult.set(null);
  }

  cancelEdit(): void {
    this.viewMode.set('details');
    this.testResult.set(null);
  }

  updateFormField<K extends keyof SourceFormModel>(
    field: K,
    value: SourceFormModel[K]
  ): void {
    this.form.update((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === 'sourceType') {
      this.draft.set(this.sourceManager.createDraftFor(value as SourceProviderType));
      this.testResult.set(null);
    }
  }

  patchForm(patch: Partial<SourceFormModel>): void {
    this.form.update((current) => ({
      ...current,
      ...patch,
    }));
  }

  updateDraft(patch: Partial<SourceDraft>): void {
    this.draft.update((current) => ({
      ...current,
      ...patch,
    }));
    this.testResult.set(null);
  }

  resolveSelectedForm(selectedSource: SourceRecord | null): SourceFormModel {
    if (!selectedSource) {
      return createSourceForm(this.form().sourceType || 'FILESYSTEM');
    }

    return toSourceFormModel(selectedSource);
  }

  resolveSelectedDraft(selectedSource: SourceRecord | null): SourceDraft {
    if (!selectedSource) {
      return this.sourceManager.createDraftFor(
        this.resolveSelectedForm(selectedSource).sourceType
      );
    }

    return this.sourceManager.hydrateDraft(
      selectedSource.sourceType,
      selectedSource.configurationJson
    );
  }
}
