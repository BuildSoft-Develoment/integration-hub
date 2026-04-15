import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProcessTaskBindingOption, ProcessTaskBodyFieldBindingDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';

@Component({
  selector: 'ih-process-rest-path-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, MatAutocompleteModule, MatChipsModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="path-builder">
      <div class="path-builder__header">
        <p class="section-eyebrow">{{ i18n.t('ui.restPathParameters') }}</p>
        <h5>{{ i18n.t('ui.restPathParametersHint') }}</h5>
      </div>

      <div class="path-builder__field-shell">
        <label class="path-builder__field-label">{{ i18n.t('ui.restPathBuilderLabel') }}</label>
        <mat-form-field class="path-builder__field" subscriptSizing="dynamic">
          <mat-chip-grid #chipGrid aria-label="REST path segments">
            @for (segment of segments(); track trackSegment(segment, $index); let index = $index) {
              <mat-chip-row [removable]="!readonly()" (removed)="removeSegment(index)">
                {{ displaySegment(segment) }}
                @if (!readonly()) {
                  <button matChipRemove type="button" [attr.aria-label]="i18n.t('ui.remove')">x</button>
                }
              </mat-chip-row>
            }
          </mat-chip-grid>
          <input
            #pathTrigger="matAutocompleteTrigger"
            [disabled]="readonly()"
            [placeholder]="i18n.t('ui.restPathBuilderPlaceholder')"
            [ngModel]="segmentInput()"
            (ngModelChange)="segmentInput.set($event)"
            [matChipInputFor]="chipGrid"
            [matAutocomplete]="auto"
            (matChipInputTokenEnd)="commitTypedSegment()"
            (blur)="handleInputBlur(pathTrigger)"
          />
          <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selectAutocompleteOption($event)">
            @for (group of groupedSuggestions(); track group.key) {
              <mat-optgroup [label]="group.label">
                @for (item of group.items; track item.trackKey) {
                  <mat-option [value]="item.trackKey">{{ item.label }}</mat-option>
                }
              </mat-optgroup>
            }
          </mat-autocomplete>
        </mat-form-field>
      </div>

      @if (!segments().length) {
        <div class="path-builder__empty">{{ i18n.t('ui.restPathSegmentsEmpty') }}</div>
      }
    </section>
  `,
  styles: [`
      :host {
        display: block;
      }
      .path-builder {
        display: grid;
        gap: 0.9rem;
      }
      .path-builder__header {
        display: grid;
        gap: 0.22rem;
      }
      .section-eyebrow {
        margin: 0;
        font-size: 0.74rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--ih-text-soft);
      }
      .path-builder__header h5 {
        margin: 0;
        font-size: 0.98rem;
      }
      .path-builder__field-shell {
        display: grid;
        gap: 0.35rem;
      }
      .path-builder__field-label {
        font-size: 0.84rem;
        font-weight: 600;
        color: var(--ih-text-soft);
      }
      .path-builder__field {
        width: 100%;
      }
      .path-builder__field ::ng-deep .mat-mdc-form-field-infix {
        min-height: 3.5rem;
        padding-top: 0.75rem;
      }
      .path-builder__empty {
        color: var(--ih-text-soft);
        font-size: 0.86rem;
      }
    `],
})
export class ProcessRestPathBuilderComponent {
  readonly i18n = inject(I18nService);

  readonly segments = input.required<readonly ProcessTaskBodyFieldBindingDraft[]>();
  readonly sourceGroups = input.required<ReadonlyArray<{ key: string; items: readonly ProcessTaskBindingOption[] }>>();
  readonly readonly = input(false);

  readonly segmentsChange = output<ProcessTaskBodyFieldBindingDraft[]>();

  readonly segmentInput = signal('');
  readonly groupedSuggestions = computed(() => {
    const query = this.segmentInput().trim().toLowerCase();
    const sourceGroups = this.sourceGroups()
      .map((group) => ({
        key: group.key,
        label: this.i18n.t(group.key),
        items: group.items
          .filter((item) => !query || item.label.toLowerCase().includes(query) || item.key.toLowerCase().includes(query))
          .map((item) => ({
            trackKey: `source:${item.kind}:${item.key}`,
            label: item.label,
          })),
      }))
      .filter((group) => group.items.length);

    if (!query) {
      return sourceGroups;
    }

    return [
      {
        key: 'literal',
        label: this.i18n.t('ui.restPathLiteralGroup'),
        items: [{ trackKey: `literal:${query}`, label: query }],
      },
      ...sourceGroups,
    ];
  });

  displaySegment(segment: ProcessTaskBodyFieldBindingDraft): string {
    if (segment.expression?.trim()) {
      return segment.expression.trim();
    }
    const key = segment.sourceKey?.trim();
    return key ? `{${key}}` : '';
  }

  trackSegment(segment: ProcessTaskBodyFieldBindingDraft, index: number): string {
    return `${segment.sourceKind || 'literal'}:${segment.sourceKey || segment.expression || 'segment'}:${index}`;
  }

  commitTypedSegment(): void {
    const value = this.segmentInput().trim();
    if (!value) {
      return;
    }
    this.segmentInput.set('');
    this.emit([...this.segments(), this.createLiteralSegment(value)]);
  }

  selectAutocompleteOption(event: MatAutocompleteSelectedEvent): void {
    const raw = String(event.option.value || '');
    this.segmentInput.set('');
    if (raw.startsWith('literal:')) {
      const value = raw.slice('literal:'.length).trim();
      if (value) {
        this.emit([...this.segments(), this.createLiteralSegment(value)]);
      }
      return;
    }
    const option = this.resolveOption(raw);
    if (!option) {
      return;
    }
    this.emit([...this.segments(), this.createSourceSegment(option)]);
  }

  handleInputBlur(trigger: MatAutocompleteTrigger): void {
    setTimeout(() => trigger.closePanel(), 120);
  }

  removeSegment(index: number): void {
    this.emit(this.segments().filter((_, currentIndex) => currentIndex !== index));
  }

  private emit(segments: ProcessTaskBodyFieldBindingDraft[]): void {
    this.segmentsChange.emit(segments);
  }

  private resolveOption(trackKey: string): ProcessTaskBindingOption | null {
    const [, kind, key] = trackKey.split(':');
    if (!kind || !key) {
      return null;
    }
    return this.sourceGroups()
      .flatMap((group) => group.items)
      .find((item) => item.kind === kind && item.key === key) ?? null;
  }

  private createLiteralSegment(value: string): ProcessTaskBodyFieldBindingDraft {
    return {
      name: '',
      sourceKind: 'expression',
      sourceKey: '',
      sourceLabel: '',
      expression: value,
    };
  }

  private createSourceSegment(option: ProcessTaskBindingOption): ProcessTaskBodyFieldBindingDraft {
    return {
      name: '',
      sourceKind: option.kind,
      sourceKey: option.key,
      sourceLabel: option.label,
      expression: '',
    };
  }
}
