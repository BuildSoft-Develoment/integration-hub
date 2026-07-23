import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DbWriteMappingDraft, ProcessTaskBindingOption } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { DbWriteColumnRef, DbWriteSourceItem } from '../../../../models/process-db-write.models';
import { BindingOriginSelectComponent } from '../../shared/binding-origin-select/binding-origin-select.component';

@Component({
  selector: 'ih-process-db-write-mapping-board',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, BindingOriginSelectComponent],
  templateUrl: './process-db-write-mapping-board.component.html',
  styleUrl: './process-db-write-mapping-board.component.css',
})
export class ProcessDbWriteMappingBoardComponent {
  readonly i18n = inject(I18nService);

  readonly columns = input.required<readonly DbWriteColumnRef[]>();
  readonly mappings = input.required<readonly DbWriteMappingDraft[]>();
  readonly sourceGroups = input.required<ReadonlyArray<{ key: string; items: readonly DbWriteSourceItem[] }>>();
  readonly readonly = input(false);
  readonly draggingSource = input<DbWriteSourceItem | null>(null);
  /**
   * Clave i18n del estado vacio. El MOTIVO de que no haya columnas lo conoce el form padre (no hay conexion
   * elegida, o se eligio el datasource de la plataforma, que no las expone); este tablero es tonto y solo las
   * pinta, asi que recibe el mensaje en vez de adivinarlo.
   */
  readonly emptyMessageKey = input('ui.dbWriteNoColumns');

  readonly sourceDrop = output<{ columnName: string; source: DbWriteSourceItem }>();
  readonly expressionChange = output<{ columnName: string; expression: string }>();
  readonly keyChange = output<{ columnName: string; value: boolean }>();
  readonly clear = output<string>();
  readonly hoveredColumn = signal<string | null>(null);
  readonly trashHover = signal(false);

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

  handleSourcePicked(columnName: string, source: ProcessTaskBindingOption): void {
    // El composite compartido emite ProcessTaskBindingOption; en runtime es un DbWriteSourceItem (de sourceGroups).
    this.sourceDrop.emit({ columnName, source: source as DbWriteSourceItem });
  }

  // Rastrea la columna bajo el drag (para la papelera): la emite el composite compartido via hoverChange.
  onRowHover(columnName: string, hovering: boolean): void {
    if (hovering) {
      this.hoveredColumn.set(columnName);
    } else if (this.hoveredColumn() === columnName) {
      this.hoveredColumn.set(null);
    }
  }

  allowDrop(event: DragEvent): void {
    if (!this.readonly()) {
      event.preventDefault();
    }
  }

  handleTrashDrop(event: DragEvent): void {
    event.preventDefault();
    this.trashHover.set(false);
    const columnName = this.hoveredColumn();
    this.hoveredColumn.set(null);
    if (columnName) {
      this.clear.emit(columnName);
    }
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
    return translated === groupKey ? groupKey : translated;
  }
}
