import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ConnectionTypeFormComponentBase } from '../connection-type-form.abstract';

@Component({
  selector: 'ih-connection-jdbc-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './connection-jdbc-form.component.html',
  styleUrl: './connection-jdbc-form.component.css',
})
export class ConnectionJdbcFormComponent extends ConnectionTypeFormComponentBase {}
