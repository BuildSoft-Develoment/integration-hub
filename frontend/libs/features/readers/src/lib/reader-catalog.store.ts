import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ReaderDraft, ReaderProviderType } from '@integration-hub/core/providers';
import {
  AppFeedbackService,
  AuthService,
  ReaderManagerService,
} from '@integration-hub/core/services';
import {
  createReaderForm,
  ReaderFormModel,
  ReaderRecord,
  toReaderFormModel,
} from './reader.models';
import { ReaderApiService } from './reader-api.service';

type ViewMode = 'details' | 'edit';

@Injectable()
export class ReaderCatalogStore implements OnDestroy {
  private readonly api = inject(ReaderApiService);
  private readonly readerManager = inject(ReaderManagerService);
  private readonly authService = inject(AuthService);
  private readonly feedback = inject(AppFeedbackService);
  private readonly searchDebounceMs = 300;
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private requestSequence = 0;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly readers = signal<ReaderRecord[]>([]);
  readonly totalLength = signal(0);
  readonly search = signal('');
  readonly typeFilter = signal<'ALL' | ReaderProviderType>('ALL');
  readonly selectedReaderId = signal<number | null>(null);
  readonly selectedReader = signal<ReaderRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);
  readonly viewMode = signal<ViewMode>('details');
  readonly form = signal<ReaderFormModel>(createReaderForm('TXT'));
  readonly draft = signal<ReaderDraft>(this.readerManager.createDraftFor('TXT'));

  readonly canEdit = computed(() => this.authService.canAdmin());
  readonly pagedReaders = computed(() => this.readers());

  readonly selectedForm = computed<ReaderFormModel>(() => {
    const reader = this.selectedReader();
    if (!reader) {
      return createReaderForm(this.form().readerType || 'TXT');
    }
    return toReaderFormModel(reader);
  });

  readonly selectedDraft = computed<ReaderDraft>(() => {
    const reader = this.selectedReader();
    if (!reader) {
      return this.readerManager.createDraftFor(this.selectedForm().readerType);
    }
    return this.readerManager.hydrateDraft(reader.readerType, reader.configurationJson);
  });

  readonly formTitle = computed(() =>
    this.viewMode() === 'edit'
      ? this.form().id
        ? 'readers.edit'
        : 'readers.create'
      : 'readers.detail'
  );

  async load(): Promise<void> {
    await this.loadReaders(true);
  }

  ngOnDestroy(): void {
    this.clearSearchDebounce();
  }

  selectReader(reader: ReaderRecord): void {
    this.selectedReaderId.set(reader.id);
    this.selectedReader.set(reader);
    this.viewMode.set('details');
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.clearSearchDebounce();
    this.pageSize.set(pageSize);
    this.currentPage.set(pageIndex);
    void this.loadReaders(false);
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.scheduleSearchReload();
  }

  updateTypeFilter(value: 'ALL' | ReaderProviderType): void {
    this.typeFilter.set(value);
    this.clearSearchDebounce();
    void this.loadReaders(true);
  }

  startCreate(): void {
    const readerType = this.form().readerType || 'TXT';
    this.form.set(createReaderForm(readerType));
    this.draft.set(this.readerManager.createDraftFor(readerType));
    this.viewMode.set('edit');
    this.drawerOpen.set(true);
  }

  startEdit(reader: ReaderRecord): void {
    this.selectedReaderId.set(reader.id);
    this.selectedReader.set(reader);
    this.form.set(toReaderFormModel(reader));
    this.draft.set(this.readerManager.hydrateDraft(reader.readerType, reader.configurationJson));
    this.viewMode.set('edit');
    this.drawerOpen.set(true);
  }

  cancelEdit(): void {
    this.drawerOpen.set(false);
    this.viewMode.set('details');
  }

  updateFormField<K extends keyof ReaderFormModel>(field: K, value: ReaderFormModel[K]): void {
    const nextForm = {
      ...this.form(),
      [field]: value,
    };
    this.form.set(nextForm);
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

  async save(): Promise<void> {
    this.saving.set(true);
    try {
      const form = this.form();
      const configurationJson = this.readerManager.serializeDraft(form.readerType, this.draft());
      const payload = {
        name: form.name,
        readerType: form.readerType,
        active: form.active,
        configurationJson,
      };
      const saved = form.id
        ? await firstValueFrom(this.api.update(form.id, payload))
        : await firstValueFrom(this.api.create(payload));

      this.selectedReaderId.set(saved.id);
      this.selectedReader.set(saved);
      this.viewMode.set('details');
      this.drawerOpen.set(true);
      await this.loadReaders(false);
      this.feedback[form.id ? 'updated' : 'created']('entities.reader');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(reader: ReaderRecord): Promise<void> {
    const updated = await firstValueFrom(this.api.setActive(reader.id, !reader.active));
    this.selectedReaderId.set(updated.id);
    this.selectedReader.set(updated);
    this.drawerOpen.set(true);
    await this.loadReaders(false);
    this.feedback[reader.active ? 'deactivated' : 'activated']('entities.reader');
  }

  private async loadReaders(resetPage: boolean): Promise<void> {
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
          page: this.currentPage(),
          size: this.pageSize(),
        })
      );

      if (requestId !== this.requestSequence) {
        return;
      }

      this.readers.set(response.items);
      this.totalLength.set(response.total);

      const selectedId = this.selectedReaderId();
      if (selectedId != null) {
        const refreshed = response.items.find((item) => item.id === selectedId);
        if (refreshed) {
          this.selectedReader.set(refreshed);
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
      void this.loadReaders(true);
    }, this.searchDebounceMs);
  }

  private clearSearchDebounce(): void {
    if (this.searchDebounceHandle != null) {
      clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }
  }
}
