import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SourceTypeFormComponentBase } from './source-type-form.abstract';

@Component({
  selector: 'ih-source-ftp-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule],
  template: `
    <div class="form-grid">
      <mat-form-field><mat-label>{{ i18n.t('ui.host') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().host" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('host', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.port') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().port" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('port', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.username') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().username" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('username', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.password') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().password" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('password', $event)" /></mat-form-field>
      <mat-form-field class="full"><mat-label>{{ i18n.t('ui.remotePath') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().remotePath" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('remotePath', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.fileNameTemplate') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().fileNameTemplate" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('fileNameTemplate', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.timeoutMillis') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().timeoutMillis" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('timeoutMillis', $event)" /></mat-form-field>
      <mat-form-field><mat-label>{{ i18n.t('ui.mediaType') }}</mat-label><input matInput [disabled]="readonly()" [ngModel]="draft().mediaType" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('mediaType', $event)" /></mat-form-field>
      <div class="toggle-wrap"><mat-slide-toggle [disabled]="readonly()" [ngModel]="draft().passiveMode" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('passiveMode', $event)">{{ i18n.t('ui.passiveMode') }}</mat-slide-toggle></div>
      <mat-form-field class="full"><mat-label>{{ i18n.t('ui.templateVariablesText') }}</mat-label><textarea matInput [disabled]="readonly()" rows="4" [ngModel]="draft().templateVariablesText" [ngModelOptions]="{ standalone: true }" (ngModelChange)="update('templateVariablesText', $event)"></textarea></mat-form-field>
    </div>
  `,
  styles: [
    `
      .form-grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .full { grid-column: 1 / -1; }
      .toggle-wrap { display: flex; align-items: center; }
      @media (max-width: 900px) { .form-grid { grid-template-columns: 1fr; } }
    `,
  ],
})
export class SourceFtpFormComponent extends SourceTypeFormComponentBase {}
