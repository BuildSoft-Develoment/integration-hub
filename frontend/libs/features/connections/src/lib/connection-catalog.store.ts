import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConnectionDraft, ConnectionProviderType } from '@integration-hub/core/providers';
import {
  AppFeedbackService,
  AuthService,
  ConnectionManagerService,
} from '@integration-hub/core/services';
import {
  ConnectionFormModel,
  ConnectionRecord,
  ConnectionTestResult,
  createConnectionForm,
  toConnectionFormModel,
} from './connection.models';
import { ConnectionApiService } from './connection-api.service';

type ViewMode = 'details' | 'edit';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Injectable()
export class ConnectionCatalogStore implements OnDestroy {
  private readonly api = inject(ConnectionApiService);
  private readonly connectionManager = inject(ConnectionManagerService);
  private readonly authService = inject(AuthService);
  private readonly feedback = inject(AppFeedbackService);
  private readonly searchDebounceMs = 300;
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private requestSequence = 0;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly testing = signal(false);
  readonly connections = signal<ConnectionRecord[]>([]);
  readonly totalLength = signal(0);
  readonly search = signal('');
  readonly typeFilter = signal<'ALL' | ConnectionProviderType>('ALL');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly selectedConnectionId = signal<number | null>(null);
  readonly selectedConnection = signal<ConnectionRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);
  readonly viewMode = signal<ViewMode>('details');
  readonly testResult = signal<ConnectionTestResult | null>(null);
  readonly form = signal<ConnectionFormModel>(createConnectionForm('POSTGRESQL'));
  readonly draft = signal<ConnectionDraft>(this.connectionManager.createDraftFor('POSTGRESQL'));

  readonly canEdit = computed(() => this.authService.canAdmin());
  readonly pagedConnections = computed(() => this.connections());

  readonly selectedForm = computed<ConnectionFormModel>(() => {
    const connection = this.selectedConnection();
    if (!connection) {
      return createConnectionForm(this.form().connectionType || 'POSTGRESQL');
    }
    return toConnectionFormModel(connection);
  });

  readonly selectedDraft = computed<ConnectionDraft>(() => {
    const connection = this.selectedConnection();
    if (!connection) {
      return this.connectionManager.createDraftFor(this.selectedForm().connectionType);
    }
    return this.connectionManager.hydrateDraft(
      connection.connectionType,
      connection.configurationJson
    );
  });

  readonly formTitle = computed(() =>
    this.viewMode() === 'edit'
      ? this.form().id
        ? 'connections.edit'
        : 'connections.create'
      : 'connections.detail'
  );

  async load(): Promise<void> {
    await this.loadConnections(true);
  }

  ngOnDestroy(): void {
    this.clearSearchDebounce();
  }

  selectConnection(connection: ConnectionRecord): void {
    this.selectedConnectionId.set(connection.id);
    this.selectedConnection.set(connection);
    this.viewMode.set('details');
    this.testResult.set(null);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.testResult.set(null);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.clearSearchDebounce();
    this.pageSize.set(pageSize);
    this.currentPage.set(pageIndex);
    void this.loadConnections(false);
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.scheduleSearchReload();
  }

  updateTypeFilter(value: 'ALL' | ConnectionProviderType): void {
    this.typeFilter.set(value);
    this.clearSearchDebounce();
    void this.loadConnections(true);
  }

  updateStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.clearSearchDebounce();
    void this.loadConnections(true);
  }

  startCreate(): void {
    const connectionType = this.form().connectionType || 'POSTGRESQL';
    this.form.set(createConnectionForm(connectionType));
    this.draft.set(this.connectionManager.createDraftFor(connectionType));
    this.viewMode.set('edit');
    this.testResult.set(null);
    this.drawerOpen.set(true);
  }

  startEdit(connection: ConnectionRecord): void {
    this.selectedConnectionId.set(connection.id);
    this.selectedConnection.set(connection);
    this.form.set(toConnectionFormModel(connection));
    this.draft.set(
      this.connectionManager.hydrateDraft(connection.connectionType, connection.configurationJson)
    );
    this.viewMode.set('edit');
    this.testResult.set(null);
    this.drawerOpen.set(true);
  }

  cancelEdit(): void {
    this.drawerOpen.set(false);
    this.viewMode.set('details');
    this.testResult.set(null);
  }

  updateFormField<K extends keyof ConnectionFormModel>(
    field: K,
    value: ConnectionFormModel[K]
  ): void {
    const nextForm = {
      ...this.form(),
      [field]: value,
    };
    this.form.set(nextForm);
    if (field === 'connectionType') {
      this.draft.set(this.connectionManager.createDraftFor(value as ConnectionProviderType));
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

  async save(): Promise<void> {
    this.saving.set(true);
    try {
      const form = this.form();
      const configurationJson = this.connectionManager.serializeDraft(
        form.connectionType,
        this.draft()
      );
      const payload = {
        name: form.name,
        connectionType: form.connectionType,
        active: form.active,
        configurationJson,
      };
      const saved = form.id
        ? await firstValueFrom(this.api.update(form.id, payload))
        : await firstValueFrom(this.api.create(payload));

      this.selectedConnectionId.set(saved.id);
      this.selectedConnection.set(saved);
      this.viewMode.set('details');
      this.drawerOpen.set(true);
      this.testResult.set(null);
      await this.loadConnections(false);
      this.feedback[form.id ? 'updated' : 'created']('entities.connection');
    } finally {
      this.saving.set(false);
    }
  }

  async testConnection(): Promise<void> {
    this.testing.set(true);
    try {
      const form = this.form();
      const configurationJson = this.connectionManager.serializeDraft(
        form.connectionType,
        this.draft()
      );
      const payload = {
        name: form.name,
        connectionType: form.connectionType,
        active: form.active,
        configurationJson,
      };
      const result = await firstValueFrom(this.api.test(payload));
      this.testResult.set(result);
      if (result.success) {
        this.feedback.testSuccess('entities.connection');
      }
    } catch (error) {
      this.testResult.set({
        success: false,
        message: this.resolveErrorMessage(error),
      });
    } finally {
      this.testing.set(false);
    }
  }

  async toggleActive(connection: ConnectionRecord): Promise<void> {
    const updated = await firstValueFrom(this.api.setActive(connection.id, !connection.active));
    this.selectedConnectionId.set(updated.id);
    this.selectedConnection.set(updated);
    this.drawerOpen.set(true);
    await this.loadConnections(false);
    this.feedback[connection.active ? 'deactivated' : 'activated']('entities.connection');
  }

  private async loadConnections(resetPage: boolean): Promise<void> {
    if (resetPage) {
      this.currentPage.set(0);
    }

    const requestId = ++this.requestSequence;
    this.loading.set(true);
    try {
      const response = await firstValueFrom(
        this.api.list({
          search: this.search(),
          type: this.typeFilter(),
          status: this.statusFilter(),
          page: this.currentPage(),
          size: this.pageSize(),
        })
      );

      if (requestId !== this.requestSequence) {
        return;
      }

      this.connections.set(response.items);
      this.totalLength.set(response.total);

      const selectedId = this.selectedConnectionId();
      if (selectedId != null) {
        const refreshed = response.items.find((item) => item.id === selectedId);
        if (refreshed) {
          this.selectedConnection.set(refreshed);
        }
      }
    } finally {
      if (requestId === this.requestSequence) {
        this.loading.set(false);
      }
    }
  }

  private scheduleSearchReload(): void {
    this.clearSearchDebounce();
    this.searchDebounceHandle = setTimeout(() => {
      this.searchDebounceHandle = null;
      void this.loadConnections(true);
    }, this.searchDebounceMs);
  }

  private clearSearchDebounce(): void {
    if (this.searchDebounceHandle != null) {
      clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error as Record<string, unknown> | string | null;
      if (typeof payload === 'string' && payload.trim()) {
        return payload;
      }
      if (payload && typeof payload === 'object') {
        const details = payload['details'];
        const message = payload['message'];
        if (typeof details === 'string' && details.trim()) {
          return details;
        }
        if (typeof message === 'string' && message.trim()) {
          return message;
        }
      }
      return error.message || 'Error al probar la conexion.';
    }
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return 'Error al probar la conexion.';
  }
}
