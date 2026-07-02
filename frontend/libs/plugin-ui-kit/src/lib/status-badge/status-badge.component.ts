import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusBadgeKind = 'success' | 'error' | 'warning' | 'info' | 'neutral';

/**
 * Reusable pill badge for a semantic status, styled from the platform status design
 * tokens (light/dark aware). Part of the plugin UI kit: an external remote plugin can
 * import it from `@integration-hub/shared/ui` to render badges with the native look.
 * The label is projected: {@code <ih-status-badge status="success">Active</ih-status-badge>}.
 */
@Component({
  selector: 'ih-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="ih-status-badge" [attr.data-status]="status()"><ng-content /></span>`,
  styles: [
    `
      .ih-status-badge {
        display: inline-block;
        padding: 0.1rem 0.5rem;
        border-radius: var(--ih-radius-pill, 999px);
        font-size: var(--ih-font-size-xs, 0.72rem);
        font-weight: var(--ih-font-weight-medium, 500);
        background: color-mix(in srgb, var(--ih-status-neutral) 14%, transparent);
        color: var(--ih-status-neutral);
      }
      .ih-status-badge[data-status='success'] {
        background: var(--ih-status-success-bg);
        color: var(--ih-status-success);
      }
      .ih-status-badge[data-status='error'] {
        background: var(--ih-status-error-bg);
        color: var(--ih-status-error);
      }
      .ih-status-badge[data-status='warning'] {
        background: var(--ih-status-warning-bg);
        color: var(--ih-status-warning);
      }
      .ih-status-badge[data-status='info'] {
        background: var(--ih-status-info-bg);
        color: var(--ih-status-info);
      }
    `,
  ],
})
export class StatusBadgeComponent {
  readonly status = input<StatusBadgeKind>('neutral');
}
