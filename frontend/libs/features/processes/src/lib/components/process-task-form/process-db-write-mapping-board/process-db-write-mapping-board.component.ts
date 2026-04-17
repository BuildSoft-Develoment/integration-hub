import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '@integration-hub/core/services';
import { DbWriteMappingDraft } from '@integration-hub/core/providers';
import { DbWriteColumnRef, DbWriteSourceItem } from '../../../process-db-write.models';

@Component({
  selector: 'ih-process-db-write-mapping-board',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule],
    templateUrl: './process-db-write-mapping-board.component.html',
    styleUrl: './process-db-write-mapping-board.component.css'
})
export class ProcessDbWriteMappingBoardComponent {
  readonly i18n = inject(I18nService);

  readonly columns = input.required<readonly DbWriteColumnRef[]>();
  readonly mappings = input.required<readonly DbWriteMappingDraft[]>();
  readonly sourceGroups = input.required<ReadonlyArray<{ key: string; items: readonly DbWriteSourceItem[] }>>();
  readonly readonly = input(false);
  readonly draggingSource = input<DbWriteSourceItem | null>(null);

  readonly sourceDrop = output<{ columnName: string; source: DbWriteSourceItem }>();
  readonly expressionChange = output<{ columnName: string; expression: string }>();
  readonly keyChange = output<{ columnName: string; value: boolean }>();
  readonly clear = output<string>();
  readonly hoveredColumn = signal<string | null>(null);

  mappingFor(columnName: string): DbWriteMappingDraft {
    return this.mappings().find((row) => row.targetColumn === columnName) ?? {
      targetColumn: columnName,
      sourceKind: null,
      sourceKey: '',
      sourceLabel: '',
      expression: '',
      key: false,
    };
  }

  hasSource(columnName: string): boolean {
    const mapping = this.mappingFor(columnName);
    return !!mapping.sourceKey && !mapping.expression;
  }

  displaySourceLabel(columnName: string): string {
    const mapping = this.mappingFor(columnName);
    if (mapping.sourceKey && !mapping.expression) {
      return mapping.sourceLabel;
    }
    return this.draggingSource() ? this.i18n.t('ui.dbWriteDropReady') : this.i18n.t('ui.dbWriteDropAction');
  }

  handleSourcePicked(columnName: string, source: DbWriteSourceItem | null): void {
    if (!source) {
      return;
    }
    this.sourceDrop.emit({ columnName, source });
  }

  allowDrop(event: DragEvent): void {
    if (this.readonly()) {
      return;
    }
    event.preventDefault();
  }

  handleDragEnter(columnName: string): void {
    if (this.readonly() || !this.draggingSource()) {
      return;
    }
    this.hoveredColumn.set(columnName);
  }

  handleDragLeave(columnName: string): void {
    if (this.hoveredColumn() === columnName) {
      this.hoveredColumn.set(null);
    }
  }

  handleDrop(event: DragEvent, columnName: string): void {
    if (this.readonly()) {
      return;
    }
    event.preventDefault();
    this.hoveredColumn.set(null);
    const source = this.draggingSource() ?? this.readFromTransfer(event);
    if (!source) {
      return;
    }
    this.sourceDrop.emit({ columnName, source });
  }

  describeColumn(column: DbWriteColumnRef): string {
    const parts = [column.dataType || ''];
    if (column.size) {
      parts.push(String(column.size));
    }
    return parts.filter(Boolean).join(' · ');
  }

  groupLabel(groupKey: string): string {
    const translated = this.i18n.t(groupKey);
    if (translated !== groupKey) {
      return translated;
    }
    switch (groupKey) {
      case 'ui.dbWriteGroup.fields':
        return this.i18n.t('ui.dbWriteGroup.fields');
      case 'ui.dbWriteGroup.variables':
        return this.i18n.t('ui.dbWriteGroup.variables');
      case 'ui.dbWriteGroup.metadata':
        return this.i18n.t('ui.dbWriteGroup.metadata');
      default:
        return groupKey;
    }
  }

  private readFromTransfer(event: DragEvent): DbWriteSourceItem | null {
    const raw = event.dataTransfer?.getData('text/plain');
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as DbWriteSourceItem;
    } catch {
      return null;
    }
  }
}
