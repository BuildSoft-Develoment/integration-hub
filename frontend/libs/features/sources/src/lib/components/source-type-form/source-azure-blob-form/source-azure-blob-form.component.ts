// @trace spec 001-catalogo-fuentes RF-006, RF-007 (catalogo-fuentes: UI de configuracion para fuente cloud Azure Blob) ADR-006
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SecretReferenceFieldComponent, SuggestInputComponent } from '@integration-hub/shared/ui';
import { SourceTypeFormComponentBase } from '../source-type-form.abstract';

@Component({
  selector: 'ih-source-azure-blob-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, SuggestInputComponent, SecretReferenceFieldComponent],
  template: `
    <div class="form-grid">
      <mat-form-field><mat-label>{{ i18n.t('ui.accountName') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().accountName" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('accountName', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.container') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().container" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('container', $event)" /></mat-form-field>
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
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.authMode') }}</mat-label>
        <mat-select [disabled]="readonly()" [ngModel]="draft().authMode" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('authMode', $event)">
          <mat-option value="account-key">account-key</mat-option>
          <mat-option value="sas-token">sas-token</mat-option>
          <mat-option value="connection-string">connection-string</mat-option>
        </mat-select>
      </mat-form-field>
      <ih-suggest-input [label]="i18n.t('ui.mediaType')" [hint]="i18n.t('ui.mediaTypeHint')" [suggestions]="mediaTypes" [disabled]="readonly()" [value]="draft().mediaType" (valueChange)="update('mediaType', $event)" />

      @if (draft().authMode === 'account-key') {
        <ih-secret-reference-field [label]="i18n.t('ui.accountKey')" [value]="draft().accountKey" [readonly]="readonly()" fieldClass="full" (valueChange)="update('accountKey', $event)" />
      }
      @if (draft().authMode === 'sas-token') {
        <ih-secret-reference-field [label]="i18n.t('ui.sasToken')" [value]="draft().sasToken" [readonly]="readonly()" fieldClass="full" (valueChange)="update('sasToken', $event)" />
      }
      @if (draft().authMode === 'connection-string') {
        <ih-secret-reference-field [label]="i18n.t('ui.connectionString')" [value]="draft().connectionString" [readonly]="readonly()" fieldClass="full" (valueChange)="update('connectionString', $event)" />
      }

      <mat-form-field class="full"><mat-label>{{ i18n.t('ui.templateVariablesText') }}</mat-label><textarea matInput [disabled]="readonly()" rows="4" [ngModel]="draft().templateVariablesText" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('templateVariablesText', $event)"></textarea><mat-hint>{{ i18n.t('ui.templateVariablesHint') }}</mat-hint></mat-form-field>
    </div>
  `,
  styleUrl: './source-azure-blob-form.component.css',
})
export class SourceAzureBlobFormComponent extends SourceTypeFormComponentBase {}
