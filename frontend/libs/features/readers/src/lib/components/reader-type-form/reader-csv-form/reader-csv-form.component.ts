// @trace RF-001, RF-002 (catalogo-readers: UI de configuracion para reader formato CSV)
import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReaderDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { SuggestInputComponent } from '@integration-hub/shared/ui';
import { ReaderFieldDefinitionsEditorComponent } from '../reader-field-definitions-editor/reader-field-definitions-editor.component';
import { ReaderTypeFormBaseComponent } from '../reader-type-form.abstract';

@Component({
  selector: 'ih-reader-csv-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, ReaderFieldDefinitionsEditorComponent, SuggestInputComponent],
  template: `
    <div class="form-grid">
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.delimiter') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().delimiter" (ngModelChange)="patchDraft.emit({ delimiter: $event })" />
      </mat-form-field>
      <ih-suggest-input [label]="i18n.t('ui.encoding')" [hint]="i18n.t('ui.encodingHint')" [suggestions]="encodings" [disabled]="readonly()" [value]="draft().encoding" (valueChange)="patchDraft.emit({ encoding: $event })" />
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.dataStartsAtRow') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().rowData" (ngModelChange)="patchDraft.emit({ rowData: $event })" />
      </mat-form-field>
    </div>

    <ih-reader-field-definitions-editor [readonly]="readonly()" [fields]="draft().fields || []" (fieldsChange)="patchDraft.emit({ fields: $event })" />
  `,
  styles: [
    `
      .form-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:0.8rem; }
      @container (max-width: 900px){ .form-grid { grid-template-columns: 1fr; } }
    `,
  ],
})
export class ReaderCsvFormComponent extends ReaderTypeFormBaseComponent {
  readonly i18n = inject(I18nService);
  readonly draft = input.required<ReaderDraft>();
  readonly readonly = input(false);
  readonly patchDraft = output<Partial<ReaderDraft>>();
}


