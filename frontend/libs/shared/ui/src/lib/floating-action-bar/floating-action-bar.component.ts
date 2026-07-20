import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IconComponent } from '@integration-hub/plugin-ui-kit';
import { I18nService } from '@integration-hub/core/services';
import { inject } from '@angular/core';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

export interface ActionBarAction {
  id: string;
  labelKey: string;
  icon: string;
  danger?: boolean;
  requiresConfirmation?: boolean;
  confirmationLabelKey?: string;
}

@Component({
  selector: 'ih-floating-action-bar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, IconComponent],
  templateUrl: './floating-action-bar.component.html',
  styleUrl: './floating-action-bar.component.css',
})
export class FloatingActionBarComponent {
  readonly i18n = inject(I18nService);
  private readonly dialog = inject(MatDialog);

  readonly selectedCount = input(0);
  readonly visible = input(false);
  readonly actions = input<readonly ActionBarAction[]>([]);

  readonly clearSelection = output<void>();
  readonly action = output<string>();

  onAction(act: ActionBarAction): void {
    if (!this.requiresConfirmation(act)) {
      this.action.emit(act.id);
      return;
    }
    // Dialogo Material (antes era window.confirm() nativo, fuera del diseno de la app).
    // El boton primario usa la etiqueta de la accion (p.ej. "Eliminar") en vez del "Descartar" por defecto.
    const message = act.confirmationLabelKey
      ? this.i18n.t(act.confirmationLabelKey)
      : `${this.i18n.t(act.labelKey)}?`;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { message, confirmLabel: this.i18n.t(act.labelKey) },
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.action.emit(act.id);
        }
      });
  }

  private requiresConfirmation(act: ActionBarAction): boolean {
    return act.requiresConfirmation === true || act.danger === true;
  }
}
