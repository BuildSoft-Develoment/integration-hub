import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReaderProviderDescriptor, ReaderProviderType } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';

@Component({
  selector: 'ih-reader-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  styles: [
    `
      .create-button { justify-self: start; }
    `,
  ],
    templateUrl: './reader-toolbar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReaderToolbarComponent {
  readonly i18n = inject(I18nService);

  readonly search = input('');
  readonly typeFilter = input<'ALL' | ReaderProviderType>('ALL');
  readonly canEdit = input(false);
  readonly providerOptions = input.required<readonly ReaderProviderDescriptor[]>();

  readonly searchChange = output<string>();
  readonly typeFilterChange = output<'ALL' | ReaderProviderType>();
  readonly create = output<void>();
}
