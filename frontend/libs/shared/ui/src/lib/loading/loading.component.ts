import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'ih-loading',
  standalone: true,
  imports: [MatProgressBarModule],
  template: `
    @if (variant() === 'bar') {
      <mat-progress-bar mode="indeterminate" />
    } @else if (variant() === 'skeleton') {
      <div class="ih-loading__skeleton" aria-hidden="true">
        @for (row of skeletonRows(); track $index) {
          <div class="ih-loading__skeleton-row"></div>
        }
      </div>
    }
    @if (label(); as text) {
      <p class="ih-loading__label" role="status" aria-live="polite">{{ text }}</p>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
    .ih-loading__skeleton {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.5rem 0;
    }
    .ih-loading__skeleton-row {
      height: 3rem;
      border-radius: var(--ih-radius-md);
      background: color-mix(in srgb, var(--ih-surface-alt) 60%, var(--ih-border));
      animation: ih-shimmer 1.6s ease-in-out infinite;
    }
    .ih-loading__label {
      color: var(--ih-text-soft);
      font-size: 0.82rem;
      margin: 0.5rem 0 0;
    }
    @keyframes ih-shimmer {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent {
  readonly variant = input<'bar' | 'skeleton'>('bar');
  readonly label = input<string | null>(null);
  readonly rows = input(8);

  protected readonly skeletonRows = computed(() =>
    Array.from({ length: this.rows() }, (_, i) => i)
  );
}
