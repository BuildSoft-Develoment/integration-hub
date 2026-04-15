import { computed, inject, Injectable, signal } from '@angular/core';
import { ConnectionDraft, ConnectionProviderType } from '@integration-hub/core/providers';
import { ConnectionManagerService } from '@integration-hub/core/services';
import {
  ConnectionFormModel,
  ConnectionRecord,
  ConnectionTestResult,
  createConnectionForm,
  toConnectionFormModel,
} from './connection.models';

type ConnectionViewMode = 'details' | 'edit';

@Injectable()
export class ConnectionEditorStateService {
  private readonly connectionManager = inject(ConnectionManagerService);

  readonly viewMode = signal<ConnectionViewMode>('details');
  readonly testResult = signal<ConnectionTestResult | null>(null);
  readonly form = signal<ConnectionFormModel>(createConnectionForm('POSTGRESQL'));
  readonly draft = signal<ConnectionDraft>(
    this.connectionManager.createDraftFor('POSTGRESQL')
  );

  readonly formTitle = computed(() =>
    this.viewMode() === 'edit'
      ? this.form().id
        ? 'connections.edit'
        : 'connections.create'
      : 'connections.detail'
  );

  showDetails(): void {
    this.viewMode.set('details');
  }

  clearTestResult(): void {
    this.testResult.set(null);
  }

  startCreate(connectionType: ConnectionProviderType): void {
    this.form.set(createConnectionForm(connectionType));
    this.draft.set(this.connectionManager.createDraftFor(connectionType));
    this.viewMode.set('edit');
    this.testResult.set(null);
  }

  startEdit(connection: ConnectionRecord): void {
    this.form.set(toConnectionFormModel(connection));
    this.draft.set(
      this.connectionManager.hydrateDraft(
        connection.connectionType,
        connection.configurationJson
      )
    );
    this.viewMode.set('edit');
    this.testResult.set(null);
  }

  cancelEdit(): void {
    this.viewMode.set('details');
    this.testResult.set(null);
  }

  updateFormField<K extends keyof ConnectionFormModel>(
    field: K,
    value: ConnectionFormModel[K]
  ): void {
    this.form.update((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === 'connectionType') {
      this.draft.set(
        this.connectionManager.createDraftFor(value as ConnectionProviderType)
      );
      this.testResult.set(null);
    }
  }

  patchForm(patch: Partial<ConnectionFormModel>): void {
    this.form.update((current) => ({
      ...current,
      ...patch,
    }));
  }

  updateDraft(patch: Partial<ConnectionDraft>): void {
    this.draft.update((current) => ({
      ...current,
      ...patch,
    }));
    this.testResult.set(null);
  }

  resolveSelectedForm(
    selectedConnection: ConnectionRecord | null
  ): ConnectionFormModel {
    if (!selectedConnection) {
      return createConnectionForm(this.form().connectionType || 'POSTGRESQL');
    }

    return toConnectionFormModel(selectedConnection);
  }

  resolveSelectedDraft(selectedConnection: ConnectionRecord | null): ConnectionDraft {
    if (!selectedConnection) {
      return this.connectionManager.createDraftFor(
        this.resolveSelectedForm(selectedConnection).connectionType
      );
    }

    return this.connectionManager.hydrateDraft(
      selectedConnection.connectionType,
      selectedConnection.configurationJson
    );
  }
}
