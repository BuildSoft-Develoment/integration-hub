// @trace RF-006, RF-007 (catalogo-fuentes: UI de configuracion para fuente cloud OCI Object Storage) ADR-006
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SourceTypeFormComponentBase } from '../source-type-form.abstract';

@Component({
  selector: 'ih-source-oci-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="form-grid">
      <mat-form-field><mat-label>{{ i18n.t('ui.namespace') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().namespace" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('namespace', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.region') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().region" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('region', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.bucket') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().bucket" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('bucket', $event)" /></mat-form-field>
      <mat-form-field class="full"><mat-label>{{ i18n.t('ui.prefix') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().prefix" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('prefix', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.fileNameTemplate') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().fileNameTemplate" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('fileNameTemplate', $event)" /></mat-form-field>
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.selectionMode') }}</mat-label>
        <mat-select [disabled]="readonly()" [ngModel]="draft().selectionMode" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('selectionMode', $event)">
          <mat-option value="latestModified">latestModified</mat-option>
          <mat-option value="single">single</mat-option>
          <mat-option value="all">all</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field><mat-label>{{ i18n.t('ui.accessKeyId') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().accessKeyId" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('accessKeyId', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.secretAccessKey') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().secretAccessKey" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('secretAccessKey', $event)" /></mat-form-field>

      <mat-form-field class="full"><mat-label>{{ i18n.t('ui.endpoint') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().endpoint" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('endpoint', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.mediaType') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().mediaType" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('mediaType', $event)" /></mat-form-field>
      <mat-form-field class="full"><mat-label>{{ i18n.t('ui.templateVariablesText') }}</mat-label><textarea matInput [disabled]="readonly()" rows="4" [ngModel]="draft().templateVariablesText" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('templateVariablesText', $event)"></textarea></mat-form-field>
    </div>
  `,
  styleUrl: './source-oci-form.component.css',
})
export class SourceOciFormComponent extends SourceTypeFormComponentBase {}
