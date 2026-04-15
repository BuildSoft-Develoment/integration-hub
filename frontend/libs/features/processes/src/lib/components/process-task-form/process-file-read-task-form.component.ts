import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskFormModel, ReaderRef, SourceRef } from '../../process.models';
import { FileReadTaskDraft } from '@integration-hub/core/providers';
import { ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskBindingContextService } from '../../process-task-binding-context.service';

@Component({
  selector: 'ih-process-file-read-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="task-grid">
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.sourceDefinition') }}</mat-label>
        <mat-select [disabled]="readonly()" [ngModel]="draft().sourceDefinitionId" (ngModelChange)="updateDraft({ sourceDefinitionId: $event })">
          <mat-option [value]="null">{{ i18n.t('ui.selectSource') }}</mat-option>
          @for (source of sources(); track source.id) {
            <mat-option [value]="source.id">{{ source.id }} - {{ source.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ i18n.t('ui.readerDefinition') }}</mat-label>
        <mat-select [disabled]="readonly()" [ngModel]="draft().readerDefinitionId" (ngModelChange)="updateDraft({ readerDefinitionId: $event })">
          <mat-option [value]="null">{{ i18n.t('ui.selectReader') }}</mat-option>
          @for (reader of filteredReaders(); track reader.id) {
            <mat-option [value]="reader.id">{{ reader.id }} - {{ reader.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    @if (selectedSourceHint()) {
      <div class="task-note">
        {{ i18n.t('ui.fileReadCompatibilityHint', { value: selectedSourceHint() }) }}
      </div>
    }

    @if (showReaderWarning()) {
      <div class="task-note task-note--warning">
        {{ i18n.t('ui.fileReadReaderMismatch') }}
      </div>
    }

    <mat-form-field class="full-width">
      <mat-label>{{ i18n.t('ui.sourceVariablesText') }}</mat-label>
      <textarea matInput [disabled]="readonly()" [ngModel]="draft().sourceVariablesText" (ngModelChange)="updateDraft({ sourceVariablesText: $event })"></textarea>
    </mat-form-field>
  `,
  styles: [`
      :host {
        display: grid;
        gap: 1rem;
        min-width: 0;
      }
      .task-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
        gap: 0.95rem;
        min-width: 0;
      }
      .full-width {
        width: 100%;
      }
      .task-note {
        padding: 0.85rem 1rem;
        border-radius: 16px;
        border: 1px dashed var(--ih-border);
        color: var(--ih-text-soft);
        background: color-mix(in srgb, var(--ih-surface-alt) 76%, transparent);
      }
      .task-note--warning {
        border-color: color-mix(in srgb, var(--ih-warning, #d97706) 35%, var(--ih-border));
        color: color-mix(in srgb, var(--ih-warning, #d97706) 78%, var(--ih-text));
      }
      textarea {
        min-height: 8rem;
      }
    `],
})
export class ProcessFileReadTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bindingContext = inject(ProcessTaskBindingContextService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly sources = input.required<readonly SourceRef[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly readonly = input(false);

  readonly patchTask = output<Partial<ProcessTaskFormModel>>();

  readonly draft = computed(() => this.manager.hydrateDraft<FileReadTaskDraft>(this.task()) ?? {
    sourceDefinitionId: null,
    readerDefinitionId: null,
    sourceVariablesText: '',
  });
  readonly selectedSource = computed(() => this.sources().find((item) => item.id === this.draft().sourceDefinitionId) ?? null);
  readonly compatibleReaderTypes = computed(() => this.bindingContext.inferCompatibleReaders(this.selectedSource()));
  readonly filteredReaders = computed(() => {
    const compatible = this.compatibleReaderTypes();
    if (!compatible.length) {
      return this.readers();
    }
    return this.readers().filter((reader) => !!reader.readerType && compatible.includes(reader.readerType as any));
  });
  readonly selectedSourceHint = computed(() => this.bindingContext.sourceCompatibilityHint(this.selectedSource()));
  readonly showReaderWarning = computed(() => {
    const reader = this.readers().find((item) => item.id === this.draft().readerDefinitionId);
    const compatible = this.compatibleReaderTypes();
    return !!reader?.readerType && compatible.length > 0 && !compatible.includes(reader.readerType as any);
  });

  updateDraft(patch: Partial<FileReadTaskDraft>): void {
    const nextDraft = { ...this.draft(), ...patch };
    this.patchTask.emit(this.manager.toTaskPatch(this.task().taskType, nextDraft));
  }
}

