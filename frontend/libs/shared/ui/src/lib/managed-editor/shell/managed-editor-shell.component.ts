import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { I18nService } from '@integration-hub/core/services';
import { inject } from '@angular/core';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'ih-managed-editor-shell',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  templateUrl: './managed-editor-shell.component.html',
  styleUrl: './managed-editor-shell.component.css',
})
export class ManagedEditorShellComponent {
  readonly i18n = inject(I18nService);
  private readonly dialog = inject(MatDialog);
  readonly dirty = input(false);
  readonly close = output<void>();

  attemptClose(): void {
    if (!this.dirty()) {
      this.close.emit();
      return;
    }
    // Dialogo Material (antes era confirm() nativo, fuera del diseno de la app), identico al de Cancelar.
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { message: this.i18n.t('common.discardConfirm') },
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.close.emit();
        }
      });
  }
}
