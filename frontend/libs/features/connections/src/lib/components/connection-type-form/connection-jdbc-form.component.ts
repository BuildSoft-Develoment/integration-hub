import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ConnectionTypeFormComponentBase } from './connection-type-form.abstract';

@Component({
  selector: 'ih-connection-jdbc-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="form-grid">
      <mat-form-field class="field-span-2">
        <mat-label>{{ i18n.t('connections.jdbcUrl') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().jdbcUrl || ''" (ngModelChange)="update('jdbcUrl', $event)" name="jdbcUrl" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ i18n.t('ui.username') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().username || ''" (ngModelChange)="update('username', $event)" name="jdbcUsername" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ i18n.t('ui.password') }}</mat-label>
        <input matInput type="password" [disabled]="readonly()" [ngModel]="draft().password || ''" (ngModelChange)="update('password', $event)" name="jdbcPassword" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ i18n.t('connections.minSize') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().minSize || ''" (ngModelChange)="update('minSize', $event)" name="jdbcMinSize" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ i18n.t('connections.maxSize') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().maxSize || ''" (ngModelChange)="update('maxSize', $event)" name="jdbcMaxSize" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ i18n.t('connections.acquisitionTimeoutSeconds') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().acquisitionTimeoutSeconds || ''" (ngModelChange)="update('acquisitionTimeoutSeconds', $event)" name="jdbcAcquisitionTimeoutSeconds" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ i18n.t('connections.validationTimeoutSeconds') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().validationTimeoutSeconds || ''" (ngModelChange)="update('validationTimeoutSeconds', $event)" name="jdbcValidationTimeoutSeconds" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ i18n.t('connections.reapTimeoutMinutes') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().reapTimeoutMinutes || ''" (ngModelChange)="update('reapTimeoutMinutes', $event)" name="jdbcReapTimeoutMinutes" />
      </mat-form-field>

      <mat-form-field class="field-span-2">
        <mat-label>{{ i18n.t('connections.initialSql') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().initialSql || ''" (ngModelChange)="update('initialSql', $event)" name="jdbcInitialSql" />
      </mat-form-field>

      <mat-form-field class="field-span-2">
        <mat-label>{{ i18n.t('connections.jdbcPropertiesJson') }}</mat-label>
        <textarea matInput rows="6" [disabled]="readonly()" [ngModel]="draft().jdbcPropertiesJson || '{}'" (ngModelChange)="update('jdbcPropertiesJson', $event)" name="jdbcPropertiesJson"></textarea>
      </mat-form-field>
    </div>
  `,
  styles: [
    `
      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.85rem;
      }
      .field-span-2 {
        grid-column: 1 / -1;
      }
      @media (max-width: 900px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
        .field-span-2 {
          grid-column: auto;
        }
      }
    `,
  ],
})
export class ConnectionJdbcFormComponent extends ConnectionTypeFormComponentBase {}
