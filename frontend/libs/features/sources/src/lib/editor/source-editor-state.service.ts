import { inject, Injectable, signal } from '@angular/core';
import { SourceDraft, SourceProviderType } from '@integration-hub/core/providers';
import {
  ManagedEditorStateBase,
  SourceManagerService,
} from '@integration-hub/core/services';
import {
  createSourceForm,
  SourceFormModel,
  SourceRecord,
  SourceTestResult,
  toSourceFormModel,
} from '../models/source.models';

@Injectable()
export class SourceEditorStateService extends ManagedEditorStateBase<
  SourceProviderType,
  SourceFormModel,
  SourceDraft,
  SourceRecord
> {
  readonly testResult = signal<SourceTestResult | null>(null);

  constructor() {
    const sourceManager = inject(SourceManagerService);
    super({
      initialType: 'FILESYSTEM',
      detailTitleKey: 'sources.detail',
      createTitleKey: 'sources.create',
      editTitleKey: 'sources.edit',
      createForm: (type) => createSourceForm(type),
      toFormModel: (record) => toSourceFormModel(record),
      createDraftFor: (type) => sourceManager.createDraftFor(type),
      hydrateDraft: (type, configurationJson) =>
        sourceManager.hydrateDraft(type, configurationJson),
      getFormType: (form) => form.sourceType,
      getRecordType: (record) => record.sourceType,
    });
  }

  clearTestResult(): void {
    this.testResult.set(null);
  }

  protected override resetTransientState(): void {
    this.testResult.set(null);
  }
}
