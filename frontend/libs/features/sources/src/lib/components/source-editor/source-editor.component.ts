import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SourceDraft,
  SourceProviderDescriptor,
  SourceProviderType,
} from '@integration-hub/core/providers';
import { SourceManagerService } from '@integration-hub/core/services';
import { ManagedEditorFormActionsComponent, ManagedEditorHeaderComponent, ManagedEditorOverviewComponent, ManagedEditorReadonlyActionsComponent, ManagedEditorSectionComponent, ManagedEditorShellComponent, ManagedEditorTestResultComponent } from '@integration-hub/shared/ui';
import { SourceFormModel, SourceTestResult } from '../../models/source.models';
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
  styleUrl: './source-editor.component.css',
    templateUrl: './source-editor.component.html'
})
export class SourceEditorComponent {
  private readonly sourceManager = inject(SourceManagerService);

  readonly form = input.required<SourceFormModel>();
  readonly draft = input.required<SourceDraft>();
  readonly providerOptions = input.required<readonly SourceProviderDescriptor[]>();
  readonly saving = input(false);
  readonly testing = input(false);
  readonly dirty = input(true);
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

  presentation() {
    return this.sourceManager.presentation(this.form().sourceType);
  }

  // CSRC-09: el Nombre es obligatorio; sin el, Guardar/Crear queda deshabilitado (defensa UI;
  // el backend igual rechaza con 400). Se usa trim para no aceptar solo espacios.
  nameValid(): boolean {
    return (this.form().name ?? '').trim().length > 0;
  }

  changeSourceType(value: string): void {
    this.sourceTypeChange.emit(value as SourceProviderType);
  }
}
