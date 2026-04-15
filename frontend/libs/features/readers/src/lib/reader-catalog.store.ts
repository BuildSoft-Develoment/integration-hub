import { computed, inject, Injectable, signal } from '@angular/core';
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
export class ReaderCatalogStore {
  private readonly api = inject(ReaderApiService);
  private readonly readerManager = inject(ReaderManagerService);
  private readonly authService = inject(AuthService);
  private readonly feedback = inject(AppFeedbackService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly readers = signal<ReaderRecord[]>([]);
  readonly search = signal('');
  readonly typeFilter = signal<'ALL' | ReaderProviderType>('ALL');
  readonly selectedReaderId = signal<number | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);
  readonly viewMode = signal<ViewMode>('details');
  readonly form = signal<ReaderFormModel>(createReaderForm('TXT'));
  readonly draft = signal<ReaderDraft>(this.readerManager.createDraftFor('TXT'));

  readonly canEdit = computed(() => this.authService.canAdmin());

  readonly filteredReaders = computed(() => {
    const search = this.search().trim().toLowerCase();
    const typeFilter = this.typeFilter();
    return this.readers().filter((reader) => {
      const matchesSearch =
        !search ||
        reader.name.toLowerCase().includes(search) ||
        String(reader.id).includes(search);
      const matchesType = typeFilter === 'ALL' || reader.readerType === typeFilter;
      return matchesSearch && matchesType;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredReaders().length / this.pageSize()))
  );

  readonly pagedReaders = computed(() => {
    const pageIndex = Math.min(this.currentPage(), this.totalPages() - 1);
    const size = this.pageSize();
    const start = pageIndex * size;
    return this.filteredReaders().slice(start, start + size);
  });

  readonly selectedReader = computed(
    () => this.readers().find((reader) => reader.id === this.selectedReaderId()) ?? null
  );

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
    this.loading.set(true);
    try {
      const result = await firstValueFrom(this.api.list());
      this.readers.set(result);
      this.currentPage.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  selectReader(reader: ReaderRecord): void {
    this.selectedReaderId.set(reader.id);
    this.viewMode.set('details');
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(
      Math.max(0, Math.min(pageIndex, Math.ceil(this.filteredReaders().length / pageSize) - 1 || 0))
    );
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(0);
  }

  updateTypeFilter(value: 'ALL' | ReaderProviderType): void {
    this.typeFilter.set(value);
    this.currentPage.set(0);
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

      await this.load();
      this.selectedReaderId.set(saved.id);
      this.viewMode.set('details');
      this.drawerOpen.set(true);
      this.feedback[form.id ? 'updated' : 'created']('entities.reader');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(reader: ReaderRecord): Promise<void> {
    await firstValueFrom(this.api.setActive(reader.id, !reader.active));
    await this.load();
    this.selectedReaderId.set(reader.id);
    this.drawerOpen.set(true);
    this.feedback[reader.active ? 'deactivated' : 'activated']('entities.reader');
  }
}
