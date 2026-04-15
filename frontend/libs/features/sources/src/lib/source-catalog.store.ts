import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
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
export class SourceCatalogStore {
  private readonly api = inject(SourceApiService);
  private readonly sourceManager = inject(SourceManagerService);
  private readonly authService = inject(AuthService);
  private readonly feedback = inject(AppFeedbackService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly testing = signal(false);
  readonly sources = signal<SourceRecord[]>([]);
  readonly search = signal('');
  readonly typeFilter = signal<'ALL' | SourceProviderType>('ALL');
  readonly statusFilter = signal<SourceStatusFilter>('ALL');
  readonly selectedSourceId = signal<number | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);
  readonly viewMode = signal<ViewMode>('details');
  readonly testResult = signal<SourceTestResult | null>(null);
  readonly form = signal<SourceFormModel>(createSourceForm('FILESYSTEM'));
  readonly draft = signal<SourceDraft>(this.sourceManager.createDraftFor('FILESYSTEM'));

  readonly canEdit = computed(() => this.authService.canAdmin());

  readonly filteredSources = computed(() => {
    const search = this.search().trim().toLowerCase();
    const typeFilter = this.typeFilter();
    const statusFilter = this.statusFilter();

    return this.sources().filter((source) => {
      const matchesSearch =
        !search ||
        source.name.toLowerCase().includes(search) ||
        String(source.id).includes(search);
      const matchesType = typeFilter === 'ALL' || source.sourceType === typeFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && source.active) ||
        (statusFilter === 'INACTIVE' && !source.active);
      return matchesSearch && matchesType && matchesStatus;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredSources().length / this.pageSize()))
  );

  readonly pagedSources = computed(() => {
    const pageIndex = Math.min(this.currentPage(), this.totalPages() - 1);
    const size = this.pageSize();
    const start = pageIndex * size;
    return this.filteredSources().slice(start, start + size);
  });

  readonly selectedSource = computed(
    () =>
      this.sources().find((source) => source.id === this.selectedSourceId()) ?? null
  );

  readonly activeProvider = computed(() =>
    this.sourceManager.resolve(
      this.viewMode() === 'edit'
        ? this.form().sourceType
        : this.selectedForm().sourceType
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
    this.loading.set(true);

    try {
      const result = await firstValueFrom(this.api.list());
      this.sources.set(result);
      this.currentPage.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  selectSource(source: SourceRecord): void {
    this.selectedSourceId.set(source.id);
    this.viewMode.set('details');
    this.testResult.set(null);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.testResult.set(null);
  }

  previousPage(): void {
    this.currentPage.update((page) => Math.max(0, page - 1));
  }

  nextPage(): void {
    this.currentPage.update((page) => Math.min(this.totalPages() - 1, page + 1));
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(Math.max(0, Math.min(pageIndex, Math.ceil(this.filteredSources().length / pageSize) - 1 || 0)));
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(0);
  }

  updateTypeFilter(value: 'ALL' | SourceProviderType): void {
    this.typeFilter.set(value);
    this.currentPage.set(0);
  }

  updateStatusFilter(value: SourceStatusFilter): void {
    this.statusFilter.set(value);
    this.currentPage.set(0);
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

      await this.load();
      this.selectedSourceId.set(saved.id);
      this.viewMode.set('details');
      this.drawerOpen.set(true);
      this.testResult.set(null);
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
    await firstValueFrom(this.api.setActive(source.id, !source.active));
    await this.load();
    this.selectedSourceId.set(source.id);
    this.drawerOpen.set(true);
    this.testResult.set(null);
    this.feedback[source.active ? 'deactivated' : 'activated']('entities.source');
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
