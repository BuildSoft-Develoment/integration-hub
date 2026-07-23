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
    templateUrl: './process-rest-path-builder.component.html',
    styleUrl: './process-rest-path-builder.component.css'
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
