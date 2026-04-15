import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { I18nService } from './i18n.service';
import {
  UiMessageSnackBarData,
  UiMessageSnackbarComponent,
} from './ui-message-snackbar.component';

export type UiMessageKind = 'success' | 'error' | 'warning' | 'info';

export interface UiMessageOptions {
  kind?: UiMessageKind;
  message?: string;
  messageKey?: string;
  vars?: Record<string, string | number>;
  durationMs?: number;
}

@Injectable({ providedIn: 'root' })
export class UiMessageService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly i18n = inject(I18nService);

  show(options: UiMessageOptions): void {
    const kind = options.kind ?? 'info';
    const message =
      options.message ??
      (options.messageKey ? this.i18n.t(options.messageKey, options.vars) : '');
    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    const severityLabel = this.i18n.t(`feedback.kind.${kind}`);
    const data: UiMessageSnackBarData = {
      kind,
      message: trimmed,
      severityLabel:
        severityLabel === `feedback.kind.${kind}` ? kind.toUpperCase() : severityLabel,
    };

    this.snackBar.openFromComponent(UiMessageSnackbarComponent, {
      data,
      duration: options.durationMs ?? (kind === 'error' ? 6500 : 3200),
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['ih-snackbar', `ih-snackbar--${kind}`],
    });
  }
}
