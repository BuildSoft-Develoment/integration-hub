import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
  Mt101BuildTaskDraft,
  ProcessTaskBindingOption,
} from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';

export type Mt101BuildMappingField = keyof Mt101BuildTaskDraft['transactionMappings'];

export interface Mt101BuildMappingTarget {
  readonly field: Mt101BuildMappingField;
  readonly labelKey: string;
  readonly path: string;
  readonly hint?: string;
}

@Component({
  selector: 'ih-process-mt101-field-mapping-board',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './process-mt101-field-mapping-board.component.html',
  styleUrl: './process-mt101-field-mapping-board.component.css',
})
export class ProcessMt101FieldMappingBoardComponent {
  readonly i18n = inject(I18nService);

  readonly targets = input.required<readonly Mt101BuildMappingTarget[]>();
  readonly mappings = input.required<Mt101BuildTaskDraft['transactionMappings']>();
  readonly sourceGroups = input.required<ReadonlyArray<{ key: string; items: readonly ProcessTaskBindingOption[] }>>();
  readonly readonly = input(false);
  readonly draggingSource = input<ProcessTaskBindingOption | null>(null);

  readonly sourceDrop = output<{ field: Mt101BuildMappingField; source: ProcessTaskBindingOption }>();
  readonly clear = output<Mt101BuildMappingField>();

  readonly hoveredField = signal<Mt101BuildMappingField | null>(null);

  valueFor(field: Mt101BuildMappingField): string {
    return String(this.mappings()[field] || '').trim();
  }

  hasSource(field: Mt101BuildMappingField): boolean {
    return this.valueFor(field).length > 0;
  }

  displaySourceLabel(field: Mt101BuildMappingField): string {
    const value = this.valueFor(field);
    if (value) {
      return value.replace(/\s*\n\s*/g, ', ');
    }
    return this.draggingSource() ? this.i18n.t('ui.dbWriteDropReady') : this.i18n.t('ui.dbWriteDropAction');
  }

  handleSourcePicked(field: Mt101BuildMappingField, source: ProcessTaskBindingOption | null): void {
    if (source) {
      this.sourceDrop.emit({ field, source });
    }
  }

  allowDrop(event: DragEvent): void {
    if (!this.readonly()) {
      event.preventDefault();
    }
  }

  handleDragEnter(field: Mt101BuildMappingField): void {
    if (this.readonly() || !this.draggingSource()) {
      return;
    }
    this.hoveredField.set(field);
  }

  handleDragLeave(field: Mt101BuildMappingField): void {
    if (this.hoveredField() === field) {
      this.hoveredField.set(null);
    }
  }

  handleDrop(event: DragEvent, field: Mt101BuildMappingField): void {
    if (this.readonly()) {
      return;
    }
    event.preventDefault();
    this.hoveredField.set(null);
    const source = this.draggingSource() ?? this.readFromTransfer(event);
    if (source) {
      this.sourceDrop.emit({ field, source });
    }
  }

  groupLabel(groupKey: string): string {
    const translated = this.i18n.t(groupKey);
    return translated !== groupKey ? translated : groupKey;
  }

  private readFromTransfer(event: DragEvent): ProcessTaskBindingOption | null {
    const raw = event.dataTransfer?.getData('text/plain');
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as ProcessTaskBindingOption;
    } catch {
      return null;
    }
  }
}
