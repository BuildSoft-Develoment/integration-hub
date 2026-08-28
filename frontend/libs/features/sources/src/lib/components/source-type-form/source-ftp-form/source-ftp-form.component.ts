// @trace spec 001-catalogo-fuentes RF-001, RF-003 (catalogo-fuentes: UI de configuracion para fuente tipo ftp)
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SecretReferenceFieldComponent, SuggestInputComponent } from '@integration-hub/shared/ui';
import { SourceTypeFormComponentBase } from '../source-type-form.abstract';

@Component({
  selector: 'ih-source-ftp-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, SuggestInputComponent, SecretReferenceFieldComponent],
  template: `
    <div class="form-grid">
      <mat-form-field><mat-label>{{ i18n.t('ui.host') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().host" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('host', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.port') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().port" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('port', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.username') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().username" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('username', $event)" /></mat-form-field>
      <ih-secret-reference-field [label]="i18n.t('ui.password')" [value]="draft().password" [readonly]="readonly()" (valueChange)="update('password', $event)" />
      <mat-form-field class="full"><mat-label>{{ i18n.t('ui.remotePath') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().remotePath" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('remotePath', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.fileNameTemplate') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().fileNameTemplate" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('fileNameTemplate', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.timeoutMillis') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().timeoutMillis" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('timeoutMillis', $event)" /></mat-form-field>
      <ih-suggest-input [label]="i18n.t('ui.mediaType')" [hint]="i18n.t('ui.mediaTypeHint')" [suggestions]="mediaTypes" [disabled]="readonly()" [value]="draft().mediaType" (valueChange)="update('mediaType', $event)" />
      <div class="toggle-wrap"><mat-slide-toggle [disabled]="readonly()" [ngModel]="draft().passiveMode" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('passiveMode', $event)">{{ i18n.t('ui.passiveMode') }}</mat-slide-toggle></div>
      <mat-form-field class="full"><mat-label>{{ i18n.t('ui.templateVariablesText') }}</mat-label><textarea matInput [disabled]="readonly()" rows="4" [ngModel]="draft().templateVariablesText" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('templateVariablesText', $event)"></textarea><mat-hint>{{ i18n.t('ui.templateVariablesHint') }}</mat-hint></mat-form-field>
    </div>
  `,
  styleUrl: './source-ftp-form.component.css',
})
export class SourceFtpFormComponent extends SourceTypeFormComponentBase {}
