// @trace spec 001-catalogo-fuentes RF-001, RF-003 (catalogo-fuentes: UI de configuracion para fuente tipo rest)
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SecretReferenceFieldComponent, SuggestInputComponent } from '@integration-hub/shared/ui';
import { SourceTypeFormComponentBase } from '../source-type-form.abstract';

@Component({
  selector: 'ih-source-rest-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, SuggestInputComponent, SecretReferenceFieldComponent],
  styleUrl: './source-rest-form.component.css',
    templateUrl: './source-rest-form.component.html'
})
export class SourceRestFormComponent extends SourceTypeFormComponentBase {}
