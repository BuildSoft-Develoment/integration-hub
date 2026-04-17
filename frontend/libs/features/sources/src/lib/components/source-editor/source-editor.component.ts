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
import { SourceTypeFormHostComponent } from '../source-type-form/source-type-form-host.component';

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
          [sectionTitleKey]="'sources.connectionProfile'"
          [fieldPrefix]="'source'"
          [name]="form().name"
          [selectedType]="form().sourceType"
          [active]="form().active"
          [readonly]="readonly()"
          [providerOptions]="providerOptions()"
          (nameChange)="patchForm.emit({ name: $event })"
          (typeChange)="changeSourceType($event)"
          (activeChange)="patchForm.emit({ active: $event })"
        />

        <ih-managed-editor-section [eyebrowKey]="'ui.provider'" [title]="providerLabel()">
          <ih-source-type-form-host
            [sourceType]="form().sourceType"
            [draft]="draft()"
            [readonly]="readonly()"
            (patchDraft)="patchDraft.emit($event)"
          />
        </ih-managed-editor-section>

        <ih-managed-editor-test-result [result]="testResult()" />

        <ih-managed-editor-form-actions
          [readonly]="readonly()"
          [saving]="saving()"
          [entityExists]="!!form().id"
          [showTest]="true"
          [testing]="testing()"
          [testLabelKey]="'sources.test'"
          [testingLabelKey]="'sources.testing'"
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

    @media (max-height: 700px) and (min-width: 761px) {
      .editor-form {
        gap: 0.7rem;
      }
    }
  `],
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
