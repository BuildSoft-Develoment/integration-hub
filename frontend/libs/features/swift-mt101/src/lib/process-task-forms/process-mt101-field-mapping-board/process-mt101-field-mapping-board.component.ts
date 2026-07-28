import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  ProcessTaskBindingOption,
} from '@integration-hub/core/providers';
import {
  Mt101BuildTaskDraft,
} from '../../process-tasks';
import { I18nService } from '@integration-hub/core/services';

export type Mt101BuildMappingField = keyof Mt101BuildTaskDraft['transactionMappings'];

export interface Mt101BuildMappingTarget {
  readonly field: Mt101BuildMappingField;
  readonly labelKey: string;
  readonly path: string;
  readonly hint?: string;
  readonly hintKey?: string;
  readonly multi?: boolean;
  readonly required?: boolean;
  /** Parte MT101 a la que pertenece (amount/beneficiary/ordering/servicing/accountWith/remittance/charges).
   *  Lo usa el form para agrupar los targets en tarjetas por-parte (opcion + campos juntos). */
  readonly party?: string;
}

@Component({
  selector: 'ih-process-mt101-field-mapping-board',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
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
  /** Opt-out del encabezado interno del board: al instanciarlo POR-PARTE (varias tarjetas) el titulo lo pone
   *  el form, no cada board, para no duplicarlo. Default true = conserva el board completo (uso legacy). */
  readonly showHeader = input(true);

  readonly sourceDrop = output<{ field: Mt101BuildMappingField; source: ProcessTaskBindingOption }>();
  readonly valueChange = output<{ field: Mt101BuildMappingField; value: string }>();
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

  selectedValues(field: Mt101BuildMappingField): string[] {
    return this.splitValues(this.valueFor(field));
  }

  handleSourcePicked(field: Mt101BuildMappingField, source: ProcessTaskBindingOption | null): void {
    if (source) {
      this.sourceDrop.emit({ field, source });
    }
  }

  handleManualChange(field: Mt101BuildMappingField, value: string): void {
    this.valueChange.emit({ field, value });
  }

  removeSelectedValue(field: Mt101BuildMappingField, index: number): void {
    const next = this.selectedValues(field).filter((_, currentIndex) => currentIndex !== index);
    this.valueChange.emit({ field, value: next.join('\n') });
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

  private splitValues(value: string): string[] {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
