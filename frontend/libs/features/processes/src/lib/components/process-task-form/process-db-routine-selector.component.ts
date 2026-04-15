import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { I18nService } from '@integration-hub/core/services';
import { DbRoutineRef } from '../../process-db-routine.models';

@Component({
  selector: 'ih-process-db-routine-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field class="routine-selector">
      <mat-label>{{ i18n.t(labelKey()) }}</mat-label>
      <input
        matInput
        [disabled]="disabled()"
        [ngModel]="query()"
        (ngModelChange)="queryChange.emit($event)"
        [matAutocomplete]="routineAutocomplete"
      />
      <mat-autocomplete
        #routineAutocomplete="matAutocomplete"
        [displayWith]="displayRoutineLabel"
        (optionSelected)="routineSelect.emit($event.option.value)"
      >
        @for (routine of routines(); track routine.qualifiedName) {
          <mat-option [value]="routine">{{ routine.qualifiedName }}</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
  styles: [`
      :host {
        display: block;
        min-width: 0;
      }
      .routine-selector {
        width: 100%;
      }
    `],
})
export class ProcessDbRoutineSelectorComponent {
  readonly i18n = inject(I18nService);

  readonly labelKey = input('ui.procedureName');
  readonly query = input('');
  readonly routines = input.required<readonly DbRoutineRef[]>();
  readonly disabled = input(false);

  readonly queryChange = output<string>();
  readonly routineSelect = output<DbRoutineRef>();

  readonly displayRoutineLabel = (routine: DbRoutineRef | string | null): string => {
    if (!routine) {
      return '';
    }
    return typeof routine === 'string' ? routine : routine.qualifiedName;
  };
}
