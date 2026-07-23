import { ChangeDetectionStrategy, Component, inject, input, viewChild, ElementRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { I18nService } from '@integration-hub/core/services';
import { SchemaFieldDescriptor } from '@integration-hub/shared/ui';

import { ProcessSchemaFieldContextService } from '../../../../forms/process-schema-field-context.service';

/**
 * Renderer de campo custom `token-text` para `ih-schema-form`: un textarea con **inserción de
 * tokens** `{fuente.output.campo}` desde el contexto de binding del proceso
 * ({@link ProcessSchemaFieldContextService}). Es la pieza reutilizable que permite migrar
 * campos ricos (p.ej. el `message` de notification) a schema-driven sin perder el autocompletado.
 *
 * Recibe los inputs del contrato de renderers ({@code field}/{@code control}/{@code readonly}) y
 * bindea el `FormControl` del schema-form, así participa en su validación y `valueChange`.
 */
@Component({
  selector: 'ih-process-token-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatMenuModule],
  templateUrl: './process-token-field.component.html',
  styleUrl: './process-token-field.component.css',
})
export class ProcessTokenFieldComponent {
  private readonly context = inject(ProcessSchemaFieldContextService);
  readonly i18n = inject(I18nService);

  readonly field = input.required<SchemaFieldDescriptor>();
  readonly control = input.required<FormControl>();
  readonly readonly = input(false);

  readonly groups = this.context.groupedOptions;
  private readonly textarea = viewChild<ElementRef<HTMLTextAreaElement>>('area');

  label(): string {
    const field = this.field();
    return field.labelKey ? this.i18n.t(field.labelKey) : field.label ?? field.key;
  }

  /** Inserta el token de la opción en la posición del caret (o al final). */
  insert(optionKey: string): void {
    if (this.readonly()) {
      return;
    }
    const token = this.context.tokenFor(optionKey);
    const control = this.control();
    const current = String(control.value ?? '');
    const area = this.textarea()?.nativeElement;
    const start = area?.selectionStart ?? current.length;
    const end = area?.selectionEnd ?? start;
    const next = current.slice(0, start) + token + current.slice(end);
    control.setValue(next);
    control.markAsDirty();
    setTimeout(() => {
      if (!area) {
        return;
      }
      area.focus();
      const caret = start + token.length;
      area.setSelectionRange(caret, caret);
    });
  }
}
