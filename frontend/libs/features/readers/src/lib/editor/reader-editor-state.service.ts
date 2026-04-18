import { inject, Injectable } from '@angular/core';
import { ReaderDraft, ReaderProviderType } from '@integration-hub/core/providers';
import {
  ManagedEditorStateBase,
  ReaderManagerService,
} from '@integration-hub/core/services';
import {
  createReaderForm,
  ReaderFormModel,
  ReaderRecord,
  toReaderFormModel,
} from '../models/reader.models';

@Injectable()
export class ReaderEditorStateService extends ManagedEditorStateBase<
  ReaderProviderType,
  ReaderFormModel,
  ReaderDraft,
  ReaderRecord
> {
  constructor() {
    const readerManager = inject(ReaderManagerService);
    super({
      initialType: 'TXT',
      detailTitleKey: 'readers.detail',
      createTitleKey: 'readers.create',
      editTitleKey: 'readers.edit',
      createForm: (type) => createReaderForm(type),
      toFormModel: (record) => toReaderFormModel(record),
      createDraftFor: (type) => readerManager.createDraftFor(type),
      hydrateDraft: (type, configurationJson) =>
        readerManager.hydrateDraft(type, configurationJson),
      getFormType: (form) => form.readerType,
      getRecordType: (record) => record.readerType,
    });
  }
}
