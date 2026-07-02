import { computed, inject, Injectable, signal } from '@angular/core';

import { ConnectionDraft, ConnectionProviderType } from '@integration-hub/core/providers';
import {
  AuthAccessService,
  ConnectionManagerService,
} from '@integration-hub/core/services';

import { ConnectionCatalogCommandService } from './connection-catalog-command.service';
import {
  ConnectionCatalogQueryStore,
  ConnectionStatusFilter,
} from './connection-catalog-query.store';
import { ConnectionEditorStateService } from '../editor/connection-editor-state.service';
import { ConnectionFormModel, ConnectionRecord } from '../models/connection.models';

@Injectable()
export class ConnectionCatalogStore {
  private readonly connectionManager = inject(ConnectionManagerService);
  private readonly editor = inject(ConnectionEditorStateService);
  private readonly query = inject(ConnectionCatalogQueryStore);
  private readonly commands = inject(ConnectionCatalogCommandService);
  private readonly access = inject(AuthAccessService);

  readonly saving = signal(false);
  readonly testing = signal(false);
  readonly loading = this.query.loading;
  readonly error = this.query.error;
  readonly connections = this.query.connections;
  readonly totalLength = this.query.totalLength;
  readonly search = this.query.search;
  readonly typeFilter = this.query.typeFilter;
  readonly statusFilter = this.query.statusFilter;
  readonly selectedConnectionId = this.query.selectedConnectionId;
  readonly selectedConnection = this.query.selectedConnection;
  readonly sortField = this.query.sortField;
  readonly sortDirection = this.query.sortDirection;
  readonly drawerOpen = this.query.drawerOpen;
  readonly currentPage = this.query.currentPage;
  readonly pageSize = this.query.pageSize;
  readonly selectedIds = this.query.selectedIds;
  readonly isAllSelected = this.query.isAllSelected;
  readonly selectedConnections = computed(() => {
    const ids = this.selectedIds();
    return this.connections().filter((connection) => ids.has(connection.id));
  });
  readonly viewMode = this.editor.viewMode;
  readonly testResult = this.editor.testResult;
  readonly form = this.editor.form;
  readonly draft = this.editor.draft;
  readonly dirty = this.editor.dirty;

  readonly canEdit = computed(() => this.access.canAdmin());
  readonly pagedConnections = this.query.pagedConnections;

  readonly selectedForm = computed<ConnectionFormModel>(() =>
    this.editor.resolveSelectedForm(this.selectedConnection())
  );

  readonly selectedDraft = computed<ConnectionDraft>(() =>
    this.editor.resolveSelectedDraft(this.selectedConnection())
  );

  readonly formTitle = this.editor.formTitle;

  async load(): Promise<void> {
    await this.query.load();
  }

  selectConnection(connection: ConnectionRecord): void {
    this.query.selectConnection(connection);
    this.editor.showDetails();
    this.editor.clearTestResult();
  }

  closeDrawer(): void {
    this.query.closeDrawer();
    this.editor.clearTestResult();
  }

  toggleSelection(id: number): void {
    this.query.toggleSelection(id);
  }

  toggleSelectAll(): void {
    this.query.toggleSelectAll();
  }

  clearSelection(): void {
    this.query.clearSelection();
  }

  async setSelectedActive(active: boolean): Promise<void> {
    const ids = this.selectedConnections()
      .filter((connection) => connection.active !== active)
      .map((connection) => connection.id);
    if (ids.length === 0) {
      this.clearSelection();
      return;
    }
    await this.commands.setActiveMany(ids, active);
    this.clearSelection();
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.query.updatePagination(pageIndex, pageSize);
  }

  updateSearch(value: string): void {
    this.query.updateSearch(value);
  }

  updateTypeFilter(value: 'ALL' | ConnectionProviderType): void {
    this.query.updateTypeFilter(value);
  }

  updateStatusFilter(value: ConnectionStatusFilter): void {
    this.query.updateStatusFilter(value);
  }

  toggleSort(field: string): void {
    this.query.toggleSort(field);
  }

  startCreate(): void {
    const connectionType = this.form().connectionType || 'POSTGRESQL';
    this.editor.startCreate(connectionType);
    this.query.openDrawer();
  }

  startEdit(connection: ConnectionRecord): void {
    this.query.markSelectedConnection(connection);
    this.editor.startEdit(connection);
    this.query.openDrawer();
  }

  cancelEdit(): void {
    this.query.closeDrawer();
    this.editor.cancelEdit();
  }

  updateFormField<K extends keyof ConnectionFormModel>(
    field: K,
    value: ConnectionFormModel[K]
  ): void {
    this.editor.updateFormField(field, value);
  }

  patchForm(patch: Partial<ConnectionFormModel>): void {
    this.editor.patchForm(patch);
  }

  updateDraft(patch: Partial<ConnectionDraft>): void {
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

  async testConnection(): Promise<void> {
    this.testing.set(true);
    try {
      await this.commands.testConnection();
    } finally {
      this.testing.set(false);
    }
  }

  async toggleActive(connection: ConnectionRecord): Promise<void> {
    await this.commands.toggleActive(connection);
  }
}
