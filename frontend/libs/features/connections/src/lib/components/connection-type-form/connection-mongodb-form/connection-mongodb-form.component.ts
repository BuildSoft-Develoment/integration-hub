// @trace spec 005-catalogo-conexiones RF-001 (conexiones: UI de configuracion para motor MONGODB)
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
  styleUrl: './connection-mongodb-form.component.css',
    templateUrl: './connection-mongodb-form.component.html'
})
export class ConnectionMongoDbFormComponent extends ConnectionTypeFormComponentBase {}
