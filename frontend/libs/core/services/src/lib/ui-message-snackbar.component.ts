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
  styles: [
    `
      .snackbar-content {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        min-width: 16rem;
      }

      .snackbar-icon {
        display: grid;
        place-items: center;
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        flex: 0 0 auto;
        color: #fff;
        background: #475569;
      }

      .snackbar-content[data-kind='success'] .snackbar-icon {
        background: #16a34a;
      }

      .snackbar-content[data-kind='error'] .snackbar-icon {
        background: #dc2626;
      }

      .snackbar-content[data-kind='warning'] .snackbar-icon {
        background: #f59e0b;
      }

      .snackbar-content[data-kind='info'] .snackbar-icon {
        background: #3b82f6;
      }

      .snackbar-svg {
        width: 1.05rem;
        height: 1.05rem;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .snackbar-copy {
        display: grid;
        gap: 0.12rem;
        min-width: 0;
      }

      .snackbar-title {
        font-size: 0.82rem;
        line-height: 1.1;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .snackbar-message {
        font-size: 0.95rem;
        line-height: 1.35;
        word-break: break-word;
      }
    `,
  ],
})
export class UiMessageSnackbarComponent {
  readonly data = inject<UiMessageSnackBarData>(MAT_SNACK_BAR_DATA);
  readonly presentation = resolveUiMessagePresentation(this.data.kind);
}
