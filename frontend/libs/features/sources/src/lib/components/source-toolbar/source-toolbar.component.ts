import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SourceProviderDescriptor, SourceProviderType } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { inject } from '@angular/core';

type SourceStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'ih-source-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  styles: [
    `
      .create-button { justify-self: start; }
    `,
  ],
    templateUrl: './source-toolbar.component.html'
})
export class SourceToolbarComponent {
  readonly i18n = inject(I18nService);

  readonly search = input('');
  readonly typeFilter = input<'ALL' | SourceProviderType>('ALL');
  readonly statusFilter = input<SourceStatusFilter>('ALL');
  readonly canEdit = input(false);
  readonly providerOptions = input.required<readonly SourceProviderDescriptor[]>();

  readonly searchChange = output<string>();
  readonly typeFilterChange = output<'ALL' | SourceProviderType>();
  readonly statusFilterChange = output<SourceStatusFilter>();
  readonly create = output<void>();
}
