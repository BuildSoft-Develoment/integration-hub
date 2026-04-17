import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskFormModel, ReaderRef, SourceRef } from '../../../process.models';
import { FileReadTaskDraft } from '@integration-hub/core/providers';
import { ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskBindingContextService } from '../../../process-task-binding-context.service';

@Component({
  selector: 'ih-process-file-read-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
    templateUrl: './process-file-read-task-form.component.html',
    styleUrl: './process-file-read-task-form.component.css'
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

