import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'ih-info-tile',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="info-tile ih-surface-card">
      <mat-card-content>
        <div class="label">{{ label() }}</div>
        <div class="value">{{ value() }}</div>
        <div class="detail ih-muted">{{ detail() }}</div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .info-tile {
        height: 100%;
      }

      .label {
        font-size: 0.82rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--ih-text-soft);
      }

      .value {
        margin-top: 0.4rem;
        font-size: clamp(1.7rem, 2vw, 2.2rem);
        font-weight: 700;
        letter-spacing: -0.05em;
      }

      .detail {
        margin-top: 0.5rem;
        font-size: 0.92rem;
      }
    `,
  ],
})
export class InfoTileComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly detail = input<string>('');
}
