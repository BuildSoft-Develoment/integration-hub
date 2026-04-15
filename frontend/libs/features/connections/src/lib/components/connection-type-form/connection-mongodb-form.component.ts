import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ConnectionTypeFormComponentBase } from './connection-type-form.abstract';

@Component({
  selector: 'ih-connection-mongodb-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="form-grid">
      <mat-form-field class="field-span-2">
        <mat-label>{{ i18n.t('connections.mongoConnectionString') }}</mat-label>
        <textarea matInput rows="4" [disabled]="readonly()" [ngModel]="draft().connectionString || ''" (ngModelChange)="update('connectionString', $event)" name="mongoConnectionString"></textarea>
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ i18n.t('connections.database') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().database || ''" (ngModelChange)="update('database', $event)" name="mongoDatabase" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ i18n.t('connections.connectTimeoutMillis') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().connectTimeoutMillis || ''" (ngModelChange)="update('connectTimeoutMillis', $event)" name="mongoConnectTimeoutMillis" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ i18n.t('connections.readTimeoutMillis') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().readTimeoutMillis || ''" (ngModelChange)="update('readTimeoutMillis', $event)" name="mongoReadTimeoutMillis" />
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
export class ConnectionMongoDbFormComponent extends ConnectionTypeFormComponentBase {}
