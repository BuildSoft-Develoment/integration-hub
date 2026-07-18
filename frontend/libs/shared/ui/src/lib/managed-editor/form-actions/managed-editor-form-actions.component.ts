import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@integration-hub/core/services';
import { inject } from '@angular/core';

@Component({
  selector: 'ih-managed-editor-form-actions',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './managed-editor-form-actions.component.html',
  styleUrl: './managed-editor-form-actions.component.css',
})
export class ManagedEditorFormActionsComponent {
  readonly i18n = inject(I18nService);

  readonly readonly = input(false);
  readonly saving = input(false);
  readonly dirty = input(true);
  readonly entityExists = input(false);
  readonly showTest = input(false);
  readonly testing = input(false);
  readonly testLabelKey = input('common.test');
  readonly testingLabelKey = input('common.testing');
  // Gate de validez del formulario: con false se deshabilita Guardar/Crear (p.ej. Nombre requerido vacio).
  // Default true para no cambiar el comportamiento de los editores que aun no lo cablean.
  readonly canSave = input(true);

  readonly test = output<void>();
  readonly cancel = output<void>();

  attemptCancel(): void {
    if (this.dirty() && !confirm(this.i18n.t('common.discardConfirm'))) {
      return;
    }
    this.cancel.emit();
  }
}
