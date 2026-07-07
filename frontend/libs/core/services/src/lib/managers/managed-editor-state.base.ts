import { computed, signal, WritableSignal } from '@angular/core';

type EditorViewMode = 'details' | 'edit';

export interface ManagedEditorStateAdapter<
  TType,
  TForm extends { id: number | null },
  TDraft,
  TRecord extends { configurationJson: string }
> {
  readonly initialType: TType;
  readonly detailTitleKey: string;
  readonly createTitleKey: string;
  readonly editTitleKey: string;
  createForm(type: TType): TForm;
  toFormModel(record: TRecord): TForm;
  createDraftFor(type: TType): TDraft;
  hydrateDraft(type: TType, configurationJson: string): TDraft;
  getFormType(form: TForm): TType;
  getRecordType(record: TRecord): TType;
}

export abstract class ManagedEditorStateBase<
  TType,
  TForm extends { id: number | null },
  TDraft,
  TRecord extends { configurationJson: string }
> {
  readonly viewMode: WritableSignal<EditorViewMode> = signal('details');
  readonly form: WritableSignal<TForm>;
  readonly draft: WritableSignal<TDraft>;
  readonly formTitle = computed(() =>
    this.viewMode() === 'edit'
      ? this.form().id
        ? this.adapter.editTitleKey
        : this.adapter.createTitleKey
      : this.adapter.detailTitleKey
  );

  private formSnapshot = '';
  private draftSnapshot = '';

  readonly dirty = computed(() => {
    if (this.viewMode() !== 'edit') {
      return false;
    }
    return JSON.stringify(this.form()) !== this.formSnapshot
      || JSON.stringify(this.draft()) !== this.draftSnapshot;
  });

  protected constructor(
    protected readonly adapter: ManagedEditorStateAdapter<
      TType,
      TForm,
      TDraft,
      TRecord
    >
  ) {
    this.form = signal(this.adapter.createForm(this.adapter.initialType));
    this.draft = signal(this.adapter.createDraftFor(this.adapter.initialType));
  }

  showDetails(): void {
    this.viewMode.set('details');
    this.resetTransientState();
  }

  startCreate(type: TType): void {
    this.form.set(this.adapter.createForm(type));
    this.draft.set(this.adapter.createDraftFor(type));
    this.captureSnapshot();
    this.viewMode.set('edit');
    this.resetTransientState();
  }

  startEdit(record: TRecord): void {
    this.form.set(this.adapter.toFormModel(record));
    this.draft.set(
      this.adapter.hydrateDraft(
        this.adapter.getRecordType(record),
        record.configurationJson
      )
    );
    this.captureSnapshot();
    this.viewMode.set('edit');
    this.resetTransientState();
  }

  cancelEdit(): void {
    this.viewMode.set('details');
    this.formSnapshot = '';
    this.draftSnapshot = '';
    this.resetTransientState();
  }

  canDiscard(): boolean {
    return !this.dirty();
  }

  updateFormField<K extends keyof TForm>(field: K, value: TForm[K]): void {
    const previousType = this.adapter.getFormType(this.form());

    this.form.update((current) => ({
      ...current,
      [field]: value,
    }));

    const nextType = this.adapter.getFormType(this.form());
    if (nextType !== previousType) {
      this.draft.set(this.adapter.createDraftFor(nextType));
      this.resetTransientState();
    }
  }

  patchForm(patch: Partial<TForm>): void {
    this.form.update((current) => ({
      ...current,
      ...patch,
    }));
  }

  updateDraft(patch: Partial<TDraft>): void {
    this.draft.update((current) => ({
      ...current,
      ...patch,
    }));
    this.resetTransientState();
  }

  resolveSelectedForm(selectedRecord: TRecord | null): TForm {
    if (!selectedRecord) {
      return this.adapter.createForm(this.adapter.getFormType(this.form()));
    }

    return this.adapter.toFormModel(selectedRecord);
  }

  resolveSelectedDraft(selectedRecord: TRecord | null): TDraft {
    if (!selectedRecord) {
      return this.adapter.createDraftFor(
        this.adapter.getFormType(this.resolveSelectedForm(selectedRecord))
      );
    }

    return this.adapter.hydrateDraft(
      this.adapter.getRecordType(selectedRecord),
      selectedRecord.configurationJson
    );
  }

  protected resetTransientState(): void {
    // Hook opcional: las subclases con estado transitorio lo sobreescriben; por defecto no-op.
  }

  private captureSnapshot(): void {
    this.formSnapshot = JSON.stringify(this.form());
    this.draftSnapshot = JSON.stringify(this.draft());
  }
}
