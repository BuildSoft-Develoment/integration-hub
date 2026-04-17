import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { I18nService } from '@integration-hub/core/services';
import { DbRoutineRef } from '../../../process-db-routine.models';

@Component({
  selector: 'ih-process-db-routine-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
  styles: [`
      :host {
        display: block;
        min-width: 0;
      }
      .routine-selector {
        width: 100%;
      }
    `],
    templateUrl: './process-db-routine-selector.component.html'
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
