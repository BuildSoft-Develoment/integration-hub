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
    styleUrl: './info-tile.component.css'
})
export class InfoTileComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly detail = input<string>('');
}
