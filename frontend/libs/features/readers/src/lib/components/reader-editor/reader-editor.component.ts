import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ReaderDraft,
  ReaderProviderDescriptor,
  ReaderProviderType,
} from '@integration-hub/core/providers';
import { ReaderManagerService } from '@integration-hub/core/services';
import { ManagedEditorFormActionsComponent, ManagedEditorHeaderComponent, ManagedEditorOverviewComponent, ManagedEditorReadonlyActionsComponent, ManagedEditorSectionComponent, ManagedEditorShellComponent } from '@integration-hub/shared/ui';
import { ReaderFormModel } from '../../models/reader.models';
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
  styleUrl: './reader-editor.component.css',
    templateUrl: './reader-editor.component.html'
})
export class ReaderEditorComponent {
  private readonly readerManager = inject(ReaderManagerService);

  readonly form = input.required<ReaderFormModel>();
  readonly draft = input.required<ReaderDraft>();
  readonly providerOptions = input.required<readonly ReaderProviderDescriptor[]>();
  readonly saving = input(false);
  readonly dirty = input(true);
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

  presentation() {
    return this.readerManager.presentation(this.form().readerType);
  }

  changeReaderType(value: string): void {
    this.readerTypeChange.emit(value as ReaderProviderType);
  }
}
