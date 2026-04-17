import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ReaderDraft,
  ReaderProviderDescriptor,
  ReaderProviderType,
} from '@integration-hub/core/providers';
import { ManagedEditorFormActionsComponent, ManagedEditorHeaderComponent, ManagedEditorOverviewComponent, ManagedEditorReadonlyActionsComponent, ManagedEditorSectionComponent, ManagedEditorShellComponent } from '@integration-hub/shared/ui';
import { ReaderFormModel } from '../../reader.models';
import { ReaderTypeFormHostComponent } from '../reader-type-form/reader-type-form-host.component';

@Component({
  selector: 'ih-reader-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ManagedEditorFormActionsComponent,
    ManagedEditorHeaderComponent,
    ManagedEditorOverviewComponent,
    ManagedEditorReadonlyActionsComponent,
    ManagedEditorSectionComponent,
    ManagedEditorShellComponent,
    ReaderTypeFormHostComponent,
  ],
  template: `
    <ih-managed-editor-shell (close)="close.emit()">
      <ih-managed-editor-header
        editor-header
        [titleKey]="titleKey()"
        [subtitle]="providerLabel()"
      />

      <ih-managed-editor-readonly-actions
        editor-readonly-actions
        [readonly]="readonly()"
        [canEdit]="canEdit()"
        [active]="form().active"
        (edit)="edit.emit()"
        (toggleActive)="toggleActive.emit()"
      />

      <form editor-form class="editor-form" (ngSubmit)="!readonly() && save.emit()">
        <ih-managed-editor-overview
          [sectionTitleKey]="'readers.definitionProfile'"
          [fieldPrefix]="'reader'"
          [name]="form().name"
          [selectedType]="form().readerType"
          [active]="form().active"
          [readonly]="readonly()"
          [providerOptions]="providerOptions()"
          (nameChange)="patchForm.emit({ name: $event })"
          (typeChange)="changeReaderType($event)"
          (activeChange)="patchForm.emit({ active: $event })"
        />

        <ih-managed-editor-section [eyebrowKey]="'ui.provider'" [title]="providerLabel()">
          <ih-reader-type-form-host
            [readerType]="form().readerType"
            [draft]="draft()"
            [readonly]="readonly()"
            (patchDraft)="patchDraft.emit($event)"
          />
        </ih-managed-editor-section>

        <ih-managed-editor-form-actions
          [readonly]="readonly()"
          [saving]="saving()"
          [entityExists]="!!form().id"
          (cancel)="cancel.emit()"
        />
      </form>
    </ih-managed-editor-shell>
  `,
  styles: [`
    .editor-form {
      display: grid;
      gap: 0.9rem;
      min-width: 0;
    }

    @media (max-height: 700px) and (min-width: 761px) {
      .editor-form {
        gap: 0.7rem;
      }
    }
  `],
})
export class ReaderEditorComponent {
  readonly form = input.required<ReaderFormModel>();
  readonly draft = input.required<ReaderDraft>();
  readonly providerOptions = input.required<readonly ReaderProviderDescriptor[]>();
  readonly saving = input(false);
  readonly titleKey = input.required<string>();
  readonly readonly = input(false);
  readonly canEdit = input(false);

  readonly patchForm = output<Partial<ReaderFormModel>>();
  readonly readerTypeChange = output<ReaderProviderType>();
  readonly patchDraft = output<Partial<ReaderDraft>>();
  readonly save = output<void>();
  readonly cancel = output<void>();
  readonly close = output<void>();
  readonly edit = output<void>();
  readonly toggleActive = output<void>();

  providerLabel(): string {
    return (
      this.providerOptions().find((provider) => provider.type === this.form().readerType)
        ?.label ?? this.form().readerType
    );
  }

  changeReaderType(value: string): void {
    this.readerTypeChange.emit(value as ReaderProviderType);
  }
}
