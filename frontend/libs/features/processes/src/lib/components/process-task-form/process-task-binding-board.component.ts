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
  template: `
    <section class="binding-board" [class.binding-board--scrollable]="scrollRows()" [class.binding-board--compact-scroll]="useCompactScroll()">
      <div class="binding-board__header ih-section-header">
        <p class="ih-section-eyebrow">{{ i18n.t(titleKey()) }}</p>
        <h5>{{ i18n.t(hintKey()) }}</h5>
      </div>

      <div class="binding-board__rows ih-thin-scroll" [class.binding-board__rows--scrollable]="scrollRows()">
        @for (entry of entries(); track trackBy(entry, $index); let index = $index) {
          <article class="binding-row" [class.binding-row--routine]="layout() === 'routine-compact'">
            @if (layout() === 'routine-compact') {
              <div class="binding-row__target">
                <strong>{{ entry.name }}</strong>
                <small>{{ describeRoutineEntry(entry) }}</small>
              </div>
            } @else {
              <mat-form-field>
                <mat-label>{{ i18n.t(nameLabelKey()) }}</mat-label>
                <input matInput [disabled]="readonly()" [ngModel]="entry.name" (ngModelChange)="patchEntry(index, { name: $event })" />
              </mat-form-field>

              @if (showJdbcType()) {
                <mat-form-field>
                  <mat-label>{{ i18n.t('ui.jdbcType') }}</mat-label>
                  <input matInput [disabled]="readonly()" [ngModel]="entry.jdbcType" (ngModelChange)="patchEntry(index, { jdbcType: $event })" />
                </mat-form-field>
              }

              @if (showDirection()) {
                <mat-form-field>
                  <mat-label>{{ i18n.t('ui.direction') }}</mat-label>
                  <mat-select [disabled]="readonly()" [ngModel]="entry.direction || 'IN'" (ngModelChange)="patchEntry(index, { direction: $event })">
                    <mat-option value="IN">IN</mat-option>
                    <mat-option value="OUT">OUT</mat-option>
                    <mat-option value="INOUT">INOUT</mat-option>
                  </mat-select>
                </mat-form-field>
              }
            }

            <mat-form-field>
              <mat-label>{{ i18n.t('ui.valueSource') }}</mat-label>
              <mat-select [disabled]="readonly()" [value]="entry.sourceKey || null" (selectionChange)="selectSource(index, $event.value)">
                <mat-option [value]="null">{{ i18n.t('ui.dbWriteSelectNone') }}</mat-option>
                @for (group of sourceGroups(); track group.key) {
                  <mat-optgroup [label]="i18n.t(group.key)">
                    @for (item of group.items; track item.kind + ':' + item.key) {
                      <mat-option [value]="item.key">{{ item.label }}</mat-option>
                    }
                  </mat-optgroup>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field class="binding-row__expression">
              <mat-label>{{ i18n.t(expressionLabelKey()) }}</mat-label>
              <input matInput [disabled]="readonly()" [ngModel]="entry.expression" (ngModelChange)="patchExpression(index, $event)" />
            </mat-form-field>

            @if (!readonly() && showRemoveAction()) {
              <button mat-stroked-button type="button" color="warn" (click)="removeEntry(index)">
                {{ i18n.t('ui.remove') }}
              </button>
            }
          </article>
        }
      </div>

      @if (!readonly() && showAddAction()) {
        <button mat-stroked-button type="button" class="binding-board__add" (click)="requestAddEntry.emit()">
          {{ i18n.t(addLabelKey()) }}
        </button>
      }
    </section>
  `,
  styles: [`
      :host { display: grid; gap: 1rem; min-width: 0; min-height: 0; }
      .binding-board { display: grid; gap: 0.9rem; min-width: 0; }
      .binding-board--scrollable {
        grid-template-rows: auto minmax(0, 1fr) auto;
        min-height: 0;
        height: 90%;
      }
      .binding-board--compact-scroll {
        height: auto;
        max-height: 100%;
      }
      .binding-board__rows { display: grid; gap: 0.85rem; min-width: 0; }
      .binding-board__rows--scrollable {
        min-height: 0;
        overflow: auto;
        padding-right: 0.2rem;
        padding-bottom: 0.9rem;
      }
      .binding-board--compact-scroll .binding-board__rows--scrollable {
        max-height: min(24rem, calc(100vh - 26rem));
      }
      .binding-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        align-items: start;
        gap: 0.85rem;
        padding: 0.85rem;
        border: 1px solid var(--ih-border);
        border-radius: 16px;
        background: color-mix(in srgb, var(--ih-surface) 97%, transparent);
      }
      .binding-row--routine {
        grid-template-columns:
          minmax(180px, 0.85fr)
          minmax(180px, 1fr)
          minmax(180px, 1fr);
        align-items: center;
        gap: 0.65rem;
        padding: 0.6rem 0.7rem;
        border-radius: 14px;
      }
      .binding-row mat-form-field {
        align-self: start;
      }
      .binding-row--routine mat-form-field {
        align-self: center;
      }
      .binding-row__target {
        display: grid;
        gap: 0.2rem;
        align-self: center;
        min-width: 0;
      }
      .binding-row__target strong,
      .binding-row__target small {
        overflow-wrap: anywhere;
      }
      .binding-row__target small {
        color: var(--ih-text-soft);
      }
      .binding-row__expression { width: 100%; }
      .binding-row--routine .binding-row__expression,
      .binding-row--routine mat-form-field {
        margin-bottom: -0.15rem;
      }
      .binding-board__add { justify-self: start; }
      @media (max-width: 1080px) {
        .binding-board--scrollable {
          grid-template-rows: auto;
          height: auto;
        }
        .binding-board__rows--scrollable {
          overflow: visible;
          padding-right: 0;
          padding-bottom: 0;
        }
      }
    `],
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
