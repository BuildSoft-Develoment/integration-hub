// @trace RF-002 (conexiones: probar conectividad + activar/desactivar)
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  ConnectionProviderDescriptor,
  ConnectionProviderType,
} from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';

type ConnectionStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'ih-connection-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  styles: [
    `
      .create-button { justify-self: start; }
    `,
  ],
    templateUrl: './connection-toolbar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionToolbarComponent {
  readonly i18n = inject(I18nService);

  readonly search = input('');
  readonly typeFilter = input<'ALL' | ConnectionProviderType>('ALL');
  readonly statusFilter = input<ConnectionStatusFilter>('ALL');
  readonly canEdit = input(false);
  readonly providerOptions = input.required<readonly ConnectionProviderDescriptor[]>();

  readonly searchChange = output<string>();
  readonly typeFilterChange = output<'ALL' | ConnectionProviderType>();
  readonly statusFilterChange = output<ConnectionStatusFilter>();
  readonly create = output<void>();
}
