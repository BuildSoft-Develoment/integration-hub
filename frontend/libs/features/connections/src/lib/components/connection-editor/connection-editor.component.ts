import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ConnectionDraft,
  ConnectionProviderDescriptor,
  ConnectionProviderType,
} from '@integration-hub/core/providers';
import { ConnectionManagerService } from '@integration-hub/core/services';
import { ManagedEditorFormActionsComponent, ManagedEditorHeaderComponent, ManagedEditorOverviewComponent, ManagedEditorReadonlyActionsComponent, ManagedEditorSectionComponent, ManagedEditorShellComponent, ManagedEditorTestResultComponent } from '@integration-hub/shared/ui';
import { ConnectionFormModel, ConnectionTestResult } from '../../models/connection.models';
import { ConnectionTypeFormHostComponent } from '../connection-type-form/connection-type-form-host/connection-type-form-host.component';

@Component({
  selector: 'ih-connection-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ManagedEditorFormActionsComponent,
    ManagedEditorHeaderComponent,
    ManagedEditorOverviewComponent,
    ManagedEditorReadonlyActionsComponent,
    ManagedEditorSectionComponent,
    ManagedEditorShellComponent,
    ManagedEditorTestResultComponent,
    ConnectionTypeFormHostComponent,
  ],
  styleUrl: './connection-editor.component.css',
  templateUrl: './connection-editor.component.html'
})
export class ConnectionEditorComponent {
  private readonly connectionManager = inject(ConnectionManagerService);

  readonly form = input.required<ConnectionFormModel>();
  readonly draft = input.required<ConnectionDraft>();
  readonly providerOptions = input.required<readonly ConnectionProviderDescriptor[]>();
  readonly titleKey = input.required<string>();
  readonly saving = input(false);
  readonly testing = input(false);
  readonly readonly = input(false);
  readonly canEdit = input(false);
  readonly testResult = input<ConnectionTestResult | null>(null);

  readonly patchForm = output<Partial<ConnectionFormModel>>();
  readonly connectionTypeChange = output<ConnectionProviderType>();
  readonly patchDraft = output<Partial<ConnectionDraft>>();
  readonly save = output<void>();
  readonly test = output<void>();
  readonly cancel = output<void>();
  readonly close = output<void>();
  readonly edit = output<void>();
  readonly toggleActive = output<void>();

  providerLabel(): string {
    return (
      this.providerOptions().find((provider) => provider.type === this.form().connectionType)
        ?.label ?? this.form().connectionType
    );
  }

  configurationPreview(): string {
    return this.connectionManager.serializeDraft(this.form().connectionType, this.draft());
  }

  changeConnectionType(value: string): void {
    this.connectionTypeChange.emit(value as ConnectionProviderType);
  }
}
