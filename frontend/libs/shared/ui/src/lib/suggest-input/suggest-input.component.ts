import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/** Sugerencias comunes reutilizables. */
export const COMMON_ENCODINGS = ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'US-ASCII', 'UTF-16'] as const;
export const COMMON_MEDIA_TYPES = [
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'application/octet-stream',
] as const;

/**
 * Campo de texto con autocompletado Material: el usuario puede ELEGIR una sugerencia o ESCRIBIR un valor
 * propio. Reemplaza los `<input>` libres de encoding (008) y media type (004) por un combo consistente.
 * Un `hint` opcional explica el campo (004: "explicar a que se refiere").
 */
@Component({
  selector: 'ih-suggest-input',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule],
  template: `
    <mat-form-field subscriptSizing="dynamic">
      <mat-label>{{ label() }}</mat-label>
      <input
        matInput
        [disabled]="disabled()"
        [ngModel]="value()"
        [ngModelOptions]="{ standalone: true }"
        (ngModelChange)="valueChange.emit($event)"
        [matAutocomplete]="auto"
      />
      <mat-autocomplete #auto="matAutocomplete">
        @for (option of suggestions(); track option) {
          <mat-option [value]="option">{{ option }}</mat-option>
        }
      </mat-autocomplete>
      @if (hint()) {
        <mat-hint>{{ hint() }}</mat-hint>
      }
    </mat-form-field>
  `,
  // Se comporta como una celda mas del grid del form (no fuerza ancho completo).
  styles: [':host{display:block;min-width:0}mat-form-field{width:100%}'],
})
export class SuggestInputComponent {
  readonly label = input('');
  readonly value = input<string | null | undefined>('');
  readonly suggestions = input<readonly string[]>([]);
  readonly hint = input<string>('');
  readonly disabled = input(false);

  readonly valueChange = output<string>();
}
