import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@integration-hub/core/services';

export interface ConfirmDialogData {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * Dialogo de confirmacion con Angular Material (reemplaza el confirm() nativo, que no seguia el
 * diseno de la app). Devuelve true si el usuario confirma la accion, false si cancela.
 */
@Component({
  selector: 'ih-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close(false)">{{ data.cancelLabel ?? i18n.t('common.cancel') }}</button>
      <button mat-flat-button color="warn" (click)="close(true)">{{ data.confirmLabel ?? i18n.t('common.discard') }}</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  readonly i18n = inject(I18nService);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<ConfirmDialogComponent, boolean>>(MatDialogRef);

  close(result: boolean): void {
    this.ref.close(result);
  }
}
