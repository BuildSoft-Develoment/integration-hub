import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_SNACK_BAR_DATA, MatSnackBarModule, MatSnackBarRef } from '@angular/material/snack-bar';
import { resolveUiMessagePresentation } from './ui-message-snackbar.presentation';

export type UiMessageKind = 'success' | 'error' | 'warning' | 'info';

export interface UiMessageSnackBarData {
  kind: UiMessageKind;
  message: string;
  severityLabel: string;
  actionLabel?: string;
  onAction?: () => void;
}

@Component({
  selector: 'ih-ui-message-snackbar',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, MatButtonModule],
  template: `
    <div class="snackbar-content" [attr.data-kind]="data.kind">
      <span class="snackbar-icon" aria-hidden="true">
        <svg [attr.viewBox]="presentation.iconViewBox ?? '0 0 24 24'" class="snackbar-svg">
          @for (path of presentation.iconPaths; track path) {
            <path [attr.d]="path" />
          }
        </svg>
      </span>
      <div class="snackbar-copy">
        <strong class="snackbar-title">{{ data.severityLabel }}</strong>
        <span class="snackbar-message">{{ data.message }}</span>
      </div>
      @if (data.actionLabel) {
        <button mat-button type="button" class="snackbar-action" (click)="onAction()">
          {{ data.actionLabel }}
        </button>
      }
    </div>
  `,
    styleUrl: './ui-message-snackbar.component.css'
})
export class UiMessageSnackbarComponent {
  readonly data = inject<UiMessageSnackBarData>(MAT_SNACK_BAR_DATA);
  readonly presentation = resolveUiMessagePresentation(this.data.kind);
  private readonly ref = inject<MatSnackBarRef<UiMessageSnackbarComponent>>(MatSnackBarRef);

  onAction(): void {
    this.data.onAction?.();
    this.ref.dismiss();
  }
}
