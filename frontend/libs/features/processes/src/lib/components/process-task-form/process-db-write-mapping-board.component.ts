import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '@integration-hub/core/services';
import { DbWriteMappingDraft } from '@integration-hub/core/providers';
import { DbWriteColumnRef, DbWriteSourceItem } from '../../process-db-write.models';

@Component({
  selector: 'ih-process-db-write-mapping-board',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="mapping-board">
      <div class="mapping-board__header ih-section-header">
        <p class="ih-section-eyebrow">{{ i18n.t('ui.dbWriteTargetColumns') }}</p>
        <h5>{{ i18n.t('ui.dbWriteTargetColumnsHint') }}</h5>
      </div>

      @if (!columns().length) {
        <div class="mapping-board__empty">{{ i18n.t('ui.dbWriteNoColumns') }}</div>
      } @else {
        <div class="mapping-board__rows ih-thin-scroll">
          @for (column of columns(); track column.name) {
            <article class="mapping-row">
              <div class="mapping-row__target">
                <strong>{{ column.name }}</strong>
                <small>{{ describeColumn(column) }}</small>
              </div>

              <div class="mapping-row__assign">
                <div
                  class="mapping-select"
                  [class.mapping-select--filled]="hasSource(column.name)"
                  [class.mapping-select--ready]="!!draggingSource()"
                  [class.mapping-select--hover]="hoveredColumn() === column.name"
                  [class.mapping-select--readonly]="readonly()"
                  (dragover)="allowDrop($event)"
                  (dragenter)="handleDragEnter(column.name)"
                  (dragleave)="handleDragLeave(column.name)"
                  (drop)="handleDrop($event, column.name)"
                >
                  <span class="mapping-select__value">{{ displaySourceLabel(column.name) }}</span>

                  <div class="mapping-select__actions">
                    @if (hasSource(column.name) && !readonly()) {
                      <button type="button" class="mapping-select__icon mapping-select__icon--clear" (click)="clear.emit(column.name)">
                        <span aria-hidden="true">×</span>
                      </button>
                    }

                    @if (!readonly()) {
                      <button
                        type="button"
                        class="mapping-select__icon"
                        [attr.aria-label]="i18n.t('ui.dbWriteOpenPicker')"
                        (click)="sourceSelect.open()"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    }
                  </div>

                  <mat-form-field class="mapping-select__field" subscriptSizing="dynamic">
                    <mat-select #sourceSelect [disabled]="readonly()" [value]="null" (selectionChange)="handleSourcePicked(column.name, $event.value)">
                      <mat-option [value]="null">{{ i18n.t('ui.dbWriteSelectNone') }}</mat-option>
                      @for (group of sourceGroups(); track group.key) {
                        <mat-optgroup [label]="groupLabel(group.key)">
                          @for (item of group.items; track item.kind + ':' + item.key) {
                            <mat-option [value]="item">{{ item.label }}</mat-option>
                          }
                        </mat-optgroup>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>
              </div>

              <mat-form-field class="mapping-row__expression">
                <mat-label>{{ i18n.t('ui.dbWriteExpression') }}</mat-label>
                <input
                  matInput
                  [disabled]="readonly()"
                  [ngModel]="mappingFor(column.name).expression"
                  (ngModelChange)="expressionChange.emit({ columnName: column.name, expression: $event })"
                />
              </mat-form-field>

              <mat-checkbox
                [disabled]="readonly() || !!mappingFor(column.name).expression"
                [ngModel]="mappingFor(column.name).key"
                (ngModelChange)="keyChange.emit({ columnName: column.name, value: !!$event })"
              >
                {{ i18n.t('ui.keyColumns') }}
              </mat-checkbox>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: [`
      :host {
        display: block;
        min-width: 0;
        min-height: 0;
      }
      .mapping-board {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 0.9rem;
        min-width: 0;
        min-height: 0;
        height: 100%;
      }
      .mapping-board__empty {
        padding: 1rem;
        border: 1px dashed var(--ih-border);
        border-radius: 16px;
        color: var(--ih-text-soft);
        background: color-mix(in srgb, var(--ih-surface-alt) 70%, transparent);
      }
      .mapping-board__rows {
        display: grid;
        gap: 0.85rem;
        align-content: start;
        min-height: 0;
        overflow: auto;
        padding: 0 0.25rem 0.5rem 0;
      }
      .mapping-row {
        display: grid;
        grid-template-columns: minmax(140px, 0.9fr) minmax(0, 1.15fr) minmax(0, 1fr) minmax(92px, auto);
        gap: 0.75rem;
        align-items: start;
        padding: 0.85rem;
        border: 1px solid var(--ih-border);
        border-radius: 16px;
        background: color-mix(in srgb, var(--ih-surface) 97%, transparent);
      }
      .mapping-row__target,
      .mapping-row__assign,
      .mapping-row__expression,
      .mapping-select {
        min-width: 0;
      }
      .mapping-row__target,
      .mapping-row__assign {
        display: grid;
        gap: 0.35rem;
      }
      .mapping-row__target small {
        color: var(--ih-text-soft);
        overflow-wrap: anywhere;
      }
      .mapping-select {
        position: relative;
        min-height: 3rem;
        border: 1px dashed var(--ih-border);
        border-radius: 14px;
        padding: 0.4rem 0.45rem 0.4rem 0.7rem;
        background: color-mix(in srgb, var(--ih-surface-alt) 82%, transparent);
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.5rem;
        transition: border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
      }
      .mapping-select--filled {
        border-style: solid;
        border-color: color-mix(in srgb, var(--ih-accent) 45%, var(--ih-border));
      }
      .mapping-select--ready {
        border-color: color-mix(in srgb, var(--ih-accent) 32%, var(--ih-border));
        background: color-mix(in srgb, var(--ih-accent) 7%, var(--ih-surface-alt));
      }
      .mapping-select--hover {
        border-style: solid;
        border-color: color-mix(in srgb, var(--ih-accent) 55%, var(--ih-border));
        background: color-mix(in srgb, var(--ih-accent) 11%, var(--ih-surface-alt));
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ih-accent) 14%, transparent);
        transform: translateY(-1px);
      }
      .mapping-select__value {
        min-width: 0;
        color: var(--ih-text-soft);
        font-size: 0.86rem;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .mapping-select--filled .mapping-select__value {
        color: var(--ih-text);
      }
      .mapping-select__actions {
        display: inline-flex;
        align-items: center;
        gap: 0.22rem;
      }
      .mapping-select__icon {
        width: 1.65rem;
        height: 1.65rem;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: var(--ih-text-soft);
        display: inline-grid;
        place-items: center;
        cursor: pointer;
      }
      .mapping-select__icon:hover {
        background: color-mix(in srgb, var(--ih-accent) 10%, transparent);
        color: var(--ih-text);
      }
      .mapping-select__icon--clear {
        color: var(--ih-danger);
      }
      .mapping-select__icon--clear:hover {
        background: color-mix(in srgb, var(--ih-danger) 14%, transparent);
        color: var(--ih-danger);
      }
      .mapping-select__icon svg {
        width: 0.95rem;
        height: 0.95rem;
        stroke: currentColor;
        fill: none;
        stroke-width: 2.2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .mapping-select__field {
        position: absolute;
        inset: 0;
        opacity: 0;
        pointer-events: none;
      }
      .mapping-select__field .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
      .mapping-row__expression {
        width: 100%;
      }
      .mapping-row mat-checkbox {
        min-width: 0;
        align-self: center;
      }
      .mapping-row mat-checkbox label {
        overflow-wrap: anywhere;
      }
      @media (max-width: 1080px) {
        .mapping-board {
          height: auto;
        }
        .mapping-board__rows {
          overflow: visible;
          max-height: none;
          padding: 0;
        }
        .mapping-row {
          grid-template-columns: 1fr;
        }
      }
    `],
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
