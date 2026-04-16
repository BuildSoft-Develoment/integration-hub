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
import { ConnectionFormModel, ConnectionTestResult } from '../../connection.models';
import { ConnectionTypeFormHostComponent } from '../connection-type-form/connection-type-form-host.component';

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
          [sectionTitleKey]="'connections.detail'"
          [fieldPrefix]="'connection'"
          [name]="form().name"
          [selectedType]="form().connectionType"
          [active]="form().active"
          [readonly]="readonly()"
          [providerOptions]="providerOptions()"
          (nameChange)="patchForm.emit({ name: $event })"
          (typeChange)="changeConnectionType($event)"
          (activeChange)="patchForm.emit({ active: $event })"
        />

        <ih-managed-editor-section [eyebrowKey]="'ui.provider'" [title]="providerLabel()">
          <ih-connection-type-form-host
            [connectionType]="form().connectionType"
            [draft]="draft()"
            [readonly]="readonly()"
            (patchDraft)="patchDraft.emit($event)"
          />
        </ih-managed-editor-section>

        <ih-managed-editor-section [eyebrowKey]="'ui.configSection'" [titleKey]="'ui.config.json'">
          <mat-form-field class="configuration-preview">
            <mat-label>{{ 'ui.config.json' }}</mat-label>
            <textarea
              matInput
              rows="8"
              [disabled]="true"
              [ngModel]="configurationPreview()"
              name="connectionConfigurationJson"
            ></textarea>
          </mat-form-field>
        </ih-managed-editor-section>

        <ih-managed-editor-test-result [result]="testResult()" />

        <ih-managed-editor-form-actions
          [readonly]="readonly()"
          [saving]="saving()"
          [entityExists]="!!form().id"
          [showTest]="true"
          [testing]="testing()"
          [testLabelKey]="'connections.test'"
          [testingLabelKey]="'connections.testing'"
          (test)="test.emit()"
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

    .configuration-preview {
      width: 100%;
      min-width: 0;
    }

    @media (max-height: 700px) and (min-width: 761px) {
      .editor-form {
        gap: 0.7rem;
      }
    }
  `],
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
