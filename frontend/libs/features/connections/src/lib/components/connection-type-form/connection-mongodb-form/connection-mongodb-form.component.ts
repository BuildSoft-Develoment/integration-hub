// @trace RF-001 (conexiones: UI de configuracion para motor MONGODB)
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ConnectionTypeFormComponentBase } from '../connection-type-form.abstract';

@Component({
  selector: 'ih-connection-mongodb-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule],
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
    templateUrl: './connection-mongodb-form.component.html'
})
export class ConnectionMongoDbFormComponent extends ConnectionTypeFormComponentBase {}
