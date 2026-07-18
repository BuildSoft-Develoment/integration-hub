import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { I18nService } from '@integration-hub/core/services';
import { inject } from '@angular/core';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'ih-managed-editor-form-actions',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  templateUrl: './managed-editor-form-actions.component.html',
  styleUrl: './managed-editor-form-actions.component.css',
})
export class ManagedEditorFormActionsComponent {
  readonly i18n = inject(I18nService);
  private readonly dialog = inject(MatDialog);

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
    if (!this.dirty()) {
      this.cancel.emit();
      return;
    }
    // Dialogo Material (antes era confirm() nativo, fuera del diseno de la app).
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { message: this.i18n.t('common.discardConfirm') },
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.cancel.emit();
        }
      });
  }
}
