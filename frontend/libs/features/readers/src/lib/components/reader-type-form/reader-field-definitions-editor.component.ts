import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { ReaderFieldDraft, ReaderFieldVariant } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { ReaderFieldDefinitionPanelComponent } from './reader-field-definition-panel.component';

@Component({
  selector: 'ih-reader-field-definitions-editor',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatExpansionModule, ReaderFieldDefinitionPanelComponent],
  template: `
    <section class="field-section">
      <div class="field-stack__header">
        <strong>{{ i18n.t('ui.fieldDefinitions', { count: fields().length }) }}</strong>

        <div class="field-stack__actions">
          @if (fields().length > 1) {
            <button mat-button type="button" (click)="expandAll()">
              {{ i18n.t('common.expandAll') }}
            </button>
            <button mat-button type="button" (click)="collapseAll()">
              {{ i18n.t('common.collapseAll') }}
            </button>
          }
          @if (!readonly()) {
            <button mat-stroked-button type="button" (click)="addField()">
              {{ i18n.t('ui.addField') }}
            </button>
          }
        </div>
      </div>

      @if (fields().length) {
        <mat-accordion class="field-accordion" [multi]="true">
          @for (field of fields(); track $index) {
            <ih-reader-field-definition-panel
              [index]="$index"
              [field]="field"
              [variant]="variant()"
              [readonly]="readonly()"
              [expanded]="expandedState()[$index]"
              [active]="activeIndex() === $index"
              (opened)="setExpanded($index, true)"
              (closed)="setExpanded($index, false)"
              (activated)="setActive($index)"
              (update)="updateField($index, $event)"
              (remove)="removeField($index)"
            />
          }
        </mat-accordion>
      } @else {
        <div class="field-empty ih-muted">{{ i18n.t('ui.addFieldEmpty') }}</div>
      }
    </section>
  `,
  styles: [
    `
      .field-section {
        display: grid;
        gap: 0.55rem;
        margin-top: 1.05rem;
      }
      .field-stack__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.55rem;
        flex-wrap: wrap;
      }
      .field-stack__actions {
        display: flex;
        align-items: center;
        gap: 0.2rem;
        flex-wrap: wrap;
      }
      .field-accordion {
        display: grid;
        gap: 0.28rem;
      }
      .field-empty {
        padding: 0.75rem 0.9rem;
        border: 1px dashed var(--ih-border);
        border-radius: 12px;
      }
    `,
  ],
})
export class ReaderFieldDefinitionsEditorComponent {
  readonly i18n = inject(I18nService);

  readonly variant = input<ReaderFieldVariant>('position');
  readonly fields = input<readonly ReaderFieldDraft[]>([]);
  readonly readonly = input(false);
  readonly fieldsChange = output<ReaderFieldDraft[]>();
  readonly expandedState = signal<Record<number, boolean>>({ 0: true });
  readonly activeIndex = signal(0);

  private createField(): ReaderFieldDraft {
    return this.variant() === 'range'
      ? { name: '', start: '', end: '', type: 'TEXT', size: '', required: false, defaultValue: '', script: '', pattern: '' }
      : { name: '', position: '', type: 'TEXT', size: '', required: false, defaultValue: '', script: '', pattern: '' };
  }

  addField(): void {
    this.fieldsChange.emit([...(this.fields() || []), this.createField()]);
    this.expandedState.update((current) => ({ ...current, [this.fields().length]: true }));
    this.activeIndex.set(this.fields().length);
  }

  updateField(index: number, patch: Partial<ReaderFieldDraft>): void {
    this.fieldsChange.emit(
      this.fields().map((field, currentIndex) =>
        currentIndex === index ? { ...field, ...patch } : field
      )
    );
  }

  removeField(index: number): void {
    this.fieldsChange.emit(this.fields().filter((_, currentIndex) => currentIndex !== index));
    this.expandedState.update((current) => {
      const next: Record<number, boolean> = {};
      Object.entries(current).forEach(([key, value]) => {
        const numericKey = Number(key);
        if (numericKey < index) {
          next[numericKey] = value;
        }
        if (numericKey > index) {
          next[numericKey - 1] = value;
        }
      });
      return next;
    });
    this.activeIndex.update((current) => {
      if (current === index) {
        return Math.max(0, index - 1);
      }
      if (current > index) {
        return current - 1;
      }
      return current;
    });
  }

  setExpanded(index: number, expanded: boolean): void {
    this.expandedState.update((current) => ({ ...current, [index]: expanded }));
    if (expanded) {
      this.activeIndex.set(index);
    }
  }

  setActive(index: number): void {
    this.activeIndex.set(index);
  }

  expandAll(): void {
    const expanded: Record<number, boolean> = {};
    this.fields().forEach((_, index) => {
      expanded[index] = true;
    });
    this.expandedState.set(expanded);
  }

  collapseAll(): void {
    this.expandedState.set({});
  }
}

