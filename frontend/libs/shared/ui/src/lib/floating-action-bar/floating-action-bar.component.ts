import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { IconComponent } from '../icon/icon.component';
import { I18nService } from '@integration-hub/core/services';
import { inject } from '@angular/core';

export interface ActionBarAction {
  id: string;
  labelKey: string;
  icon: string;
  danger?: boolean;
}

@Component({
  selector: 'ih-floating-action-bar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, IconComponent],
  templateUrl: './floating-action-bar.component.html',
  styleUrl: './floating-action-bar.component.css',
})
export class FloatingActionBarComponent {
  readonly i18n = inject(I18nService);

  readonly selectedCount = input(0);
  readonly visible = input(false);
  readonly actions = input<readonly ActionBarAction[]>([]);

  readonly clearSelection = output<void>();
  readonly action = output<string>();
}
