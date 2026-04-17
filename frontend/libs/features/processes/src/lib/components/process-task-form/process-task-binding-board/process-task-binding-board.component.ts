import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ProcessTaskBindingOption, ProcessTaskParameterBindingDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';

@Component({
  selector: 'ih-process-task-binding-board',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
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

  readonly entriesChange = output<ProcessTaskParameterBindingDraft[]>();
  readonly requestAddEntry = output<void>();

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
}
