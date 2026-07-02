import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'ih-empty-state',
  standalone: true,
  imports: [MatButtonModule, IconComponent],
  template: `
    <div class="ih-empty-state__body">
      @if (icon(); as iconPath) {
        <ih-icon [name]="iconPath" [size]="32" />
      }
      <p class="ih-empty-state__message">{{ message() }}</p>
      @if (ctaLabel(); as cta) {
        <button mat-stroked-button type="button" (click)="ctaClick.emit()">
          {{ cta }}
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 180px;
      padding: 2rem;
    }
    .ih-empty-state__body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;
    }
    .ih-empty-state__message {
      color: var(--ih-text-soft);
      font-size: 0.9rem;
      margin: 0;
      max-width: 24rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input<string | null>(null);
  readonly message = input.required<string>();
  readonly ctaLabel = input<string | null>(null);
  readonly ctaClick = output<void>();
}
