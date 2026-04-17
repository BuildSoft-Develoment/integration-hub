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
import { ReaderTypeFormHostComponent } from '../reader-type-form/reader-type-form-host/reader-type-form-host.component';

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
    templateUrl: './reader-editor.component.html'
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
