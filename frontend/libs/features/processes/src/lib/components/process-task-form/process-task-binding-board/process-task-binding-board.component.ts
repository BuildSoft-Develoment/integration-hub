import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ProcessTaskBindingOption, ProcessTaskParameterBindingDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { ProcessDbWriteSourcePaletteComponent } from '../process-db-write-source-palette/process-db-write-source-palette.component';

@Component({
  selector: 'ih-process-task-binding-board',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, ProcessDbWriteSourcePaletteComponent],
    templateUrl: './process-task-binding-board.component.html',
    styleUrl: './process-task-binding-board.component.css'
})
export class ProcessTaskBindingBoardComponent {
  readonly i18n = inject(I18nService);

  readonly entries = input.required<readonly ProcessTaskParameterBindingDraft[]>();
  readonly sourceGroups = input.required<ReadonlyArray<{ key: string; items: readonly ProcessTaskBindingOption[] }>>();
  readonly readonly = input(false);
  readonly showJdbcType = input(true);
  readonly showDirection = input(false);
  readonly titleKey = input('ui.parameterBindings');
  readonly hintKey = input('ui.parameterBindingsHint');
  readonly nameLabelKey = input('ui.parameterName');
  readonly addLabelKey = input('ui.addParameter');
  readonly expressionLabelKey = input('ui.dbWriteExpression');
  readonly showAddAction = input(true);
  readonly showRemoveAction = input(true);
  readonly scrollRows = input(false);
  readonly layout = input<'default' | 'routine-compact'>('default');
  readonly compactScrollThreshold = input(0);
  readonly showSourcePalette = input(false);

  readonly entriesChange = output<ProcessTaskParameterBindingDraft[]>();
  readonly requestAddEntry = output<void>();

  readonly draggingSource = signal<ProcessTaskBindingOption | null>(null);
  readonly hoveredIndex = signal<number | null>(null);

  trackBy(entry: ProcessTaskParameterBindingDraft, index: number): string {
    return `row-${index}`;
  }

  patchEntry(index: number, patch: Partial<ProcessTaskParameterBindingDraft>): void {
    const next = this.entries().map((entry, currentIndex) => (currentIndex === index ? { ...entry, ...patch } : entry));
    this.entriesChange.emit(next);
  }

  patchExpression(index: number, expression: string): void {
    const normalized = String(expression || '');
    this.patchEntry(index, {
      expression: normalized,
      sourceKind: normalized.trim() ? 'expression' : this.entries()[index]?.sourceKind ?? null,
      sourceKey: normalized.trim() ? '' : this.entries()[index]?.sourceKey ?? '',
      sourceLabel: normalized.trim() ? '' : this.entries()[index]?.sourceLabel ?? '',
    });
  }

  selectSource(index: number, sourceKey: string | null): void {
    if (!sourceKey) {
      this.patchEntry(index, {
        sourceKind: null,
        sourceKey: '',
        sourceLabel: '',
        expression: '',
      });
      return;
    }
    const source = this.sourceGroups()
      .flatMap((group) => group.items)
      .find((item) => item.key === sourceKey);
    if (!source) {
      return;
    }
    this.patchEntry(index, {
      sourceKind: source.kind,
      sourceKey: source.key,
      sourceLabel: source.label,
      expression: '',
    });
  }

  removeEntry(index: number): void {
    this.entriesChange.emit(this.entries().filter((_, currentIndex) => currentIndex !== index));
  }

  describeRoutineEntry(entry: ProcessTaskParameterBindingDraft): string {
    const parts = [entry.jdbcType?.trim() || ''];
    if (this.showDirection() && entry.direction?.trim()) {
      parts.push(entry.direction.trim().toUpperCase());
    }
    return parts.filter(Boolean).join(' · ');
  }

  useCompactScroll(): boolean {
    return this.scrollRows()
      && this.compactScrollThreshold() > 0
      && this.entries().length <= this.compactScrollThreshold();
  }

  hasSource(entry: ProcessTaskParameterBindingDraft): boolean {
    return !!entry.sourceKey && !entry.expression;
  }

  displaySourceLabel(entry: ProcessTaskParameterBindingDraft): string {
    if (entry.sourceKey && !entry.expression) {
      return entry.sourceLabel;
    }
    return this.draggingSource() ? this.i18n.t('ui.dbWriteDropReady') : this.i18n.t('ui.dbWriteDropAction');
  }

  allowDrop(event: DragEvent): void {
    if (this.readonly() || !this.showSourcePalette()) {
      return;
    }
    event.preventDefault();
  }

  handleDragEnter(index: number): void {
    if (this.readonly() || !this.showSourcePalette() || !this.draggingSource()) {
      return;
    }
    this.hoveredIndex.set(index);
  }

  handleDragLeave(index: number): void {
    if (this.hoveredIndex() === index) {
      this.hoveredIndex.set(null);
    }
  }

  handleDrop(event: DragEvent, index: number): void {
    if (this.readonly() || !this.showSourcePalette()) {
      return;
    }
    event.preventDefault();
    this.hoveredIndex.set(null);
    const source = this.draggingSource() ?? this.readFromTransfer(event);
    if (!source) {
      return;
    }
    this.selectSource(index, source.key);
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
