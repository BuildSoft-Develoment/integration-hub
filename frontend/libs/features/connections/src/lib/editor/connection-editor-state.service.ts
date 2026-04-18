import { inject, Injectable, signal } from '@angular/core';
import { ConnectionDraft, ConnectionProviderType } from '@integration-hub/core/providers';
import {
  ConnectionManagerService,
  ManagedEditorStateBase,
} from '@integration-hub/core/services';
import {
  ConnectionFormModel,
  ConnectionRecord,
  ConnectionTestResult,
  createConnectionForm,
  toConnectionFormModel,
} from '../models/connection.models';

@Injectable()
export class ConnectionEditorStateService extends ManagedEditorStateBase<
  ConnectionProviderType,
  ConnectionFormModel,
  ConnectionDraft,
  ConnectionRecord
> {
  readonly testResult = signal<ConnectionTestResult | null>(null);

  constructor() {
    const connectionManager = inject(ConnectionManagerService);
    super({
      initialType: 'POSTGRESQL',
      detailTitleKey: 'connections.detail',
      createTitleKey: 'connections.create',
      editTitleKey: 'connections.edit',
      createForm: (type) => createConnectionForm(type),
      toFormModel: (record) => toConnectionFormModel(record),
      createDraftFor: (type) => connectionManager.createDraftFor(type),
      hydrateDraft: (type, configurationJson) =>
        connectionManager.hydrateDraft(type, configurationJson),
      getFormType: (form) => form.connectionType,
      getRecordType: (record) => record.connectionType,
    });
  }

  clearTestResult(): void {
    this.testResult.set(null);
  }

  protected override resetTransientState(): void {
    this.testResult.set(null);
  }
}
