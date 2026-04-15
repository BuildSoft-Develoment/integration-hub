import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { I18nService } from '@integration-hub/core/services';
import { DbWriteTableRef } from '../../process-db-write.models';

@Component({
  selector: 'ih-process-db-write-table-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field class="table-selector">
      <mat-label>{{ i18n.t('ui.targetTable') }}</mat-label>
      <input
        matInput
        [disabled]="disabled()"
        [ngModel]="query()"
        (ngModelChange)="queryChange.emit($event)"
        [matAutocomplete]="tableAutocomplete"
      />
      <mat-autocomplete
        #tableAutocomplete="matAutocomplete"
        [displayWith]="displayTableLabel"
        (optionSelected)="tableSelect.emit($event.option.value)"
      >
        @for (table of tables(); track table.qualifiedName) {
          <mat-option [value]="table">{{ table.qualifiedName }}</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
  styles: [`
      :host {
        display: block;
        min-width: 0;
      }
      .table-selector {
        width: 100%;
      }
    `],
})
export class ProcessDbWriteTableSelectorComponent {
  readonly i18n = inject(I18nService);

  readonly query = input('');
  readonly tables = input.required<readonly DbWriteTableRef[]>();
  readonly disabled = input(false);

  readonly queryChange = output<string>();
  readonly tableSelect = output<DbWriteTableRef>();

  readonly displayTableLabel = (table: DbWriteTableRef | string | null): string => {
    if (!table) {
      return '';
    }
    return typeof table === 'string' ? table : table.qualifiedName;
  };
}