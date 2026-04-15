import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReaderDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { ReaderFieldDefinitionsEditorComponent } from './reader-field-definitions-editor.component';
import { ReaderTypeFormBaseComponent } from './reader-type-form.abstract';

@Component({
  selector: 'ih-reader-txt-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReaderFieldDefinitionsEditorComponent],
  template: `
    <div class="form-grid">
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.modeLabel') }}</mat-label>
        <mat-select [disabled]="readonly()" [ngModel]="draft().mode || 'delimited'" (ngModelChange)="patchDraft.emit({ mode: $event })">
          <mat-option value="delimited">delimited</mat-option>
          <mat-option value="fixed-length">fixed-length</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.encoding') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().encoding" (ngModelChange)="patchDraft.emit({ encoding: $event })" />
      </mat-form-field>
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.dataStartsAtRow') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().rowData" (ngModelChange)="patchDraft.emit({ rowData: $event })" />
      </mat-form-field>
    </div>

    @if (draft().mode !== 'fixed-length') {
      <div class="subsection-gap">
        <mat-form-field>
          <mat-label>{{ i18n.t('ui.delimiter') }}</mat-label>
          <input matInput [disabled]="readonly()" [ngModel]="draft().delimiter" (ngModelChange)="patchDraft.emit({ delimiter: $event })" />
        </mat-form-field>
      </div>
    }

    <ih-reader-field-definitions-editor
      [variant]="draft().mode === 'fixed-length' ? 'range' : 'position'"
      [readonly]="readonly()"
      [fields]="draft().mode === 'fixed-length' ? draft().fixedFields || [] : draft().fields || []"
      (fieldsChange)="patchDraft.emit(draft().mode === 'fixed-length' ? { fixedFields: $event } : { fields: $event })"
    />
  `,
  styles: [
    `
      .form-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:0.8rem; }
      .subsection-gap { margin-top: 1.05rem; }
      @container (max-width: 900px){ .form-grid { grid-template-columns: 1fr; } }
    `,
  ],
})
export class ReaderTxtFormComponent extends ReaderTypeFormBaseComponent {
  readonly i18n = inject(I18nService);
  readonly draft = input.required<ReaderDraft>();
  readonly readonly = input(false);
  readonly patchDraft = output<Partial<ReaderDraft>>();
}


