import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SourceTypeFormComponentBase } from './source-type-form.abstract';

@Component({
  selector: 'ih-source-filesystem-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="form-grid">
      <mat-form-field class="full">
        <mat-label>{{ i18n.t('ui.path') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().path" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('path', $event)" />
      </mat-form-field>
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.fileNameTemplate') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().fileNameTemplate" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('fileNameTemplate', $event)" />
      </mat-form-field>
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.mediaType') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().mediaType" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('mediaType', $event)" />
      </mat-form-field>
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.selectionMode') }}</mat-label>
        <mat-select [disabled]="readonly()" [ngModel]="draft().selectionMode" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('selectionMode', $event)">
          <mat-option value="latestModified">{{ i18n.t('ui.selectionLatestModified') }}</mat-option>
          <mat-option value="single">{{ i18n.t('ui.selectionSingle') }}</mat-option>
          <mat-option value="all">{{ i18n.t('ui.selectionAll') }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.fileErrorPolicy') }}</mat-label>
        <mat-select [disabled]="readonly()" [ngModel]="draft().fileErrorPolicy" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('fileErrorPolicy', $event)">
          <mat-option value="failFast">{{ i18n.t('ui.fileErrorPolicyFailFast') }}</mat-option>
          <mat-option value="continue">{{ i18n.t('ui.fileErrorPolicyContinue') }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field class="full">
        <mat-label>{{ i18n.t('ui.templateVariablesText') }}</mat-label>
        <textarea matInput [disabled]="readonly()" rows="4" [ngModel]="draft().templateVariablesText" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('templateVariablesText', $event)"></textarea>
      </mat-form-field>
    </div>
  `,
  styles: [
    `
      .form-grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .full { grid-column: 1 / -1; }
      @media (max-width: 900px) { .form-grid { grid-template-columns: 1fr; } }
    `,
  ],
})
export class SourceFilesystemFormComponent extends SourceTypeFormComponentBase {}
