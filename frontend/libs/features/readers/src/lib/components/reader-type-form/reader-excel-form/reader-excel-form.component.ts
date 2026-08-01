// @trace spec 002-catalogo-readers RF-001, RF-002 (catalogo-readers: UI de configuracion para reader formato XLS/XLSX)
import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReaderDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { ReaderFieldDefinitionsEditorComponent } from '../reader-field-definitions-editor/reader-field-definitions-editor.component';
import { ReaderTypeFormBaseComponent } from '../reader-type-form.abstract';

@Component({
  selector: 'ih-reader-excel-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, ReaderFieldDefinitionsEditorComponent],
  template: `
    <div class="form-grid">
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.sheetIndex') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().sheetIndex" (ngModelChange)="patchDraft.emit({ sheetIndex: $event })" />
      </mat-form-field>
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.dataStartsAtRow') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().rowData" (ngModelChange)="patchDraft.emit({ rowData: $event })" />
      </mat-form-field>
      <div class="checkbox-wrap">
        <mat-checkbox [disabled]="readonly()" [ngModel]="draft().trimValues" (ngModelChange)="patchDraft.emit({ trimValues: $event })">
          {{ i18n.t('ui.trimValues') }}
        </mat-checkbox>
      </div>
    </div>

    <ih-reader-field-definitions-editor [readonly]="readonly()" [fields]="draft().fields || []" (fieldsChange)="patchDraft.emit({ fields: $event })" />
  `,
  styles: [` .form-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:0.8rem; } .checkbox-wrap{display:flex; align-items:center; min-height:52px;} @container (max-width: 900px){ .form-grid { grid-template-columns: 1fr; } } `],
})
export class ReaderExcelFormComponent extends ReaderTypeFormBaseComponent {
  readonly i18n = inject(I18nService);
  readonly draft = input.required<ReaderDraft>();
  readonly readonly = input(false);
  readonly excelType = input<'XLS' | 'XLSX'>('XLS');
  readonly patchDraft = output<Partial<ReaderDraft>>();
}


