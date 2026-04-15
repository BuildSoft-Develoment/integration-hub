import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReaderDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { ReaderTypeFormBaseComponent } from './reader-type-form.abstract';

@Component({
  selector: 'ih-reader-xml-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="form-grid">
      <mat-form-field class="field-span-2">
        <mat-label>{{ i18n.t('ui.recordElement') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().recordElement" (ngModelChange)="patchDraft.emit({ recordElement: $event })" />
      </mat-form-field>
      <div class="checkbox-wrap">
        <mat-checkbox [disabled]="readonly()" [ngModel]="draft().includeAttributes" (ngModelChange)="patchDraft.emit({ includeAttributes: $event })">
          {{ i18n.t('ui.includeAttributes') }}
        </mat-checkbox>
      </div>
      <div class="checkbox-wrap">
        <mat-checkbox [disabled]="readonly()" [ngModel]="draft().trimValues" (ngModelChange)="patchDraft.emit({ trimValues: $event })">
          {{ i18n.t('ui.trimValues') }}
        </mat-checkbox>
      </div>
    </div>

    <mat-form-field>
      <mat-label>{{ i18n.t('ui.fieldMappings') }}</mat-label>
      <textarea matInput rows="6" [disabled]="readonly()" [ngModel]="draft().fieldMappingsText" (ngModelChange)="patchDraft.emit({ fieldMappingsText: $event })"></textarea>
    </mat-form-field>
  `,
  styles: [` .form-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:0.8rem; } .field-span-2{grid-column:1/-1;} .checkbox-wrap{display:flex; align-items:center; min-height:52px;} @container (max-width: 900px){ .form-grid { grid-template-columns: 1fr; } .field-span-2{grid-column:auto;} } `],
})
export class ReaderXmlFormComponent extends ReaderTypeFormBaseComponent {
  readonly i18n = inject(I18nService);
  readonly draft = input.required<ReaderDraft>();
  readonly readonly = input(false);
  readonly patchDraft = output<Partial<ReaderDraft>>();
}


