import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarModule } from '@angular/material/snack-bar';
import { UiMessageKind } from './ui-message.service';
import { resolveUiMessagePresentation } from './ui-message.presentation';

export interface UiMessageSnackBarData {
  kind: UiMessageKind;
  message: string;
  severityLabel: string;
}

@Component({
  selector: 'ih-ui-message-snackbar',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
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
    </div>
  `,
    styleUrl: './ui-message-snackbar.component.css'
})
export class UiMessageSnackbarComponent {
  readonly data = inject<UiMessageSnackBarData>(MAT_SNACK_BAR_DATA);
  readonly presentation = resolveUiMessagePresentation(this.data.kind);
}
