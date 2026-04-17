import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SourceDraft,
  SourceProviderDescriptor,
  SourceProviderType,
} from '@integration-hub/core/providers';
import { ManagedEditorFormActionsComponent, ManagedEditorHeaderComponent, ManagedEditorOverviewComponent, ManagedEditorReadonlyActionsComponent, ManagedEditorSectionComponent, ManagedEditorShellComponent, ManagedEditorTestResultComponent } from '@integration-hub/shared/ui';
import { SourceFormModel, SourceTestResult } from '../../source.models';
import { SourceTypeFormHostComponent } from '../source-type-form/source-type-form-host/source-type-form-host.component';

@Component({
  selector: 'ih-source-editor',
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
    ManagedEditorTestResultComponent,
    SourceTypeFormHostComponent,
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
    templateUrl: './source-editor.component.html'
})
export class SourceEditorComponent {
  readonly form = input.required<SourceFormModel>();
  readonly draft = input.required<SourceDraft>();
  readonly providerOptions = input.required<readonly SourceProviderDescriptor[]>();
  readonly saving = input(false);
  readonly testing = input(false);
  readonly titleKey = input.required<string>();
  readonly readonly = input(false);
  readonly canEdit = input(false);
  readonly testResult = input<SourceTestResult | null>(null);

  readonly patchForm = output<Partial<SourceFormModel>>();
  readonly sourceTypeChange = output<SourceProviderType>();
  readonly patchDraft = output<Partial<SourceDraft>>();
  readonly save = output<void>();
  readonly test = output<void>();
  readonly cancel = output<void>();
  readonly close = output<void>();
  readonly edit = output<void>();
  readonly toggleActive = output<void>();

  providerLabel(): string {
    return (
      this.providerOptions().find((provider) => provider.type === this.form().sourceType)
        ?.label ?? this.form().sourceType
    );
  }

  changeSourceType(value: string): void {
    this.sourceTypeChange.emit(value as SourceProviderType);
  }
}
