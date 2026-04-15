import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SourceDraft, SourceProviderType } from '@integration-hub/core/providers';
import {
  AppFeedbackService,
  AuthService,
  SourceManagerService,
} from '@integration-hub/core/services';
import {
  createSourceForm,
  SourceFormModel,
  SourceRecord,
  SourceTestResult,
  toSourceFormModel,
} from './source.models';
import { SourceApiService } from './source-api.service';

type ViewMode = 'details' | 'edit';
type SourceStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Injectable()
export class SourceCatalogStore implements OnDestroy {
  private readonly api = inject(SourceApiService);
  private readonly sourceManager = inject(SourceManagerService);
  private readonly authService = inject(AuthService);
  private readonly feedback = inject(AppFeedbackService);
  private readonly searchDebounceMs = 300;
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private requestSequence = 0;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly testing = signal(false);
  readonly sources = signal<SourceRecord[]>([]);
  readonly totalLength = signal(0);
  readonly search = signal('');
  readonly typeFilter = signal<'ALL' | SourceProviderType>('ALL');
  readonly statusFilter = signal<SourceStatusFilter>('ALL');
  readonly selectedSourceId = signal<number | null>(null);
  readonly selectedSource = signal<SourceRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);
  readonly viewMode = signal<ViewMode>('details');
  readonly testResult = signal<SourceTestResult | null>(null);
  readonly form = signal<SourceFormModel>(createSourceForm('FILESYSTEM'));
  readonly draft = signal<SourceDraft>(this.sourceManager.createDraftFor('FILESYSTEM'));

  readonly canEdit = computed(() => this.authService.canAdmin());
  readonly pagedSources = computed(() => this.sources());

  readonly activeProvider = computed(() =>
    this.sourceManager.resolve(
      this.viewMode() === 'edit' ? this.form().sourceType : this.selectedForm().sourceType
    )
  );

  readonly selectedForm = computed<SourceFormModel>(() => {
    const source = this.selectedSource();
    if (!source) {
      return createSourceForm(this.form().sourceType || 'FILESYSTEM');
    }

    return toSourceFormModel(source);
  });

  readonly selectedDraft = computed<SourceDraft>(() => {
    const source = this.selectedSource();
    if (!source) {
      return this.sourceManager.createDraftFor(this.selectedForm().sourceType);
    }

    return this.sourceManager.hydrateDraft(source.sourceType, source.configurationJson);
  });

  readonly formTitle = computed(() =>
    this.viewMode() === 'edit'
      ? this.form().id
        ? 'sources.edit'
        : 'sources.create'
      : 'sources.detail'
  );

  async load(): Promise<void> {
    await this.loadSources(true);
  }

  ngOnDestroy(): void {
    this.clearSearchDebounce();
  }

  selectSource(source: SourceRecord): void {
    this.selectedSourceId.set(source.id);
    this.selectedSource.set(source);
    this.viewMode.set('details');
    this.testResult.set(null);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.testResult.set(null);
  }

  previousPage(): void {
    this.updatePagination(Math.max(0, this.currentPage() - 1), this.pageSize());
  }

  nextPage(): void {
    this.updatePagination(this.currentPage() + 1, this.pageSize());
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.clearSearchDebounce();
    this.pageSize.set(pageSize);
    this.currentPage.set(pageIndex);
    void this.loadSources(false);
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.scheduleSearchReload();
  }

  updateTypeFilter(value: 'ALL' | SourceProviderType): void {
    this.typeFilter.set(value);
    this.clearSearchDebounce();
    void this.loadSources(true);
  }

  updateStatusFilter(value: SourceStatusFilter): void {
    this.statusFilter.set(value);
    this.clearSearchDebounce();
    void this.loadSources(true);
  }

  startCreate(): void {
    const sourceType = this.form().sourceType || 'FILESYSTEM';
    this.form.set(createSourceForm(sourceType));
    this.draft.set(this.sourceManager.createDraftFor(sourceType));
    this.viewMode.set('edit');
    this.testResult.set(null);
    this.drawerOpen.set(true);
  }

  startEdit(source: SourceRecord): void {
    this.selectedSourceId.set(source.id);
    this.selectedSource.set(source);
    this.form.set(toSourceFormModel(source));
    this.draft.set(
      this.sourceManager.hydrateDraft(source.sourceType, source.configurationJson)
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

  updateFormField<K extends keyof SourceFormModel>(
    field: K,
    value: SourceFormModel[K]
  ): void {
    const nextForm = {
      ...this.form(),
      [field]: value,
    };

    this.form.set(nextForm);

    if (field === 'sourceType') {
      this.draft.set(this.sourceManager.createDraftFor(value as SourceProviderType));
      this.testResult.set(null);
    }
  }

  updateDraft(patch: Partial<SourceDraft>): void {
    this.draft.update((current) => ({
      ...current,
      ...patch,
    }));
    this.testResult.set(null);
  }

  patchForm(patch: Partial<SourceFormModel>): void {
    this.form.update((current) => ({
      ...current,
      ...patch,
    }));
  }

  async save(): Promise<void> {
    this.saving.set(true);

    try {
      const form = this.form();
      const configurationJson = this.sourceManager.serializeDraft(
        form.sourceType,
        this.draft()
      );

      const payload = {
        name: form.name,
        sourceType: form.sourceType,
        active: form.active,
        configurationJson,
      };

      const saved = form.id
        ? await firstValueFrom(this.api.update(form.id, payload))
        : await firstValueFrom(this.api.create(payload));

      this.selectedSourceId.set(saved.id);
      this.selectedSource.set(saved);
      this.viewMode.set('details');
      this.drawerOpen.set(true);
      this.testResult.set(null);
      await this.loadSources(false);
      this.feedback[form.id ? 'updated' : 'created']('entities.source');
    } finally {
      this.saving.set(false);
    }
  }

  async testSource(): Promise<void> {
    this.testing.set(true);
    try {
      const form = this.form();
      const configurationJson = this.sourceManager.serializeDraft(
        form.sourceType,
        this.draft()
      );
      const payload = {
        name: form.name,
        sourceType: form.sourceType,
        active: form.active,
        configurationJson,
      };
      const result = await firstValueFrom(this.api.test(payload));
      this.testResult.set(result);
      if (result.success) {
        this.feedback.testSuccess('entities.source');
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

  async toggleActive(source: SourceRecord): Promise<void> {
    const updated = await firstValueFrom(this.api.setActive(source.id, !source.active));
    this.selectedSourceId.set(updated.id);
    this.selectedSource.set(updated);
    this.drawerOpen.set(true);
    this.testResult.set(null);
    await this.loadSources(false);
    this.feedback[source.active ? 'deactivated' : 'activated']('entities.source');
  }

  private async loadSources(resetPage: boolean): Promise<void> {
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

      this.sources.set(response.items);
      this.totalLength.set(response.total);

      const selectedId = this.selectedSourceId();
      if (selectedId != null) {
        const refreshed = response.items.find((item) => item.id === selectedId);
        if (refreshed) {
          this.selectedSource.set(refreshed);
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
      void this.loadSources(true);
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
      return error.message || 'Error al probar la fuente.';
    }
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return 'Error al probar la fuente.';
  }
}
