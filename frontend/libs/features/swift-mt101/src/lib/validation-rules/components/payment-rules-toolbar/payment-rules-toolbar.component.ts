import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '@integration-hub/core/services';
import { IconComponent } from '@integration-hub/shared/ui';

import { PaymentRulesCatalogStore } from '../../catalog/payment-rules-catalog.store';

/**
 * Toolbar del catálogo de reglas de pago, alineada al design system {@code ih-catalog-toolbar} (título + acciones +
 * filtros), espejo de {@code ih-source-toolbar}. Delega todo el estado en el store.
 */
@Component({
  selector: 'ih-payment-rules-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    IconComponent,
  ],
  templateUrl: './payment-rules-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentRulesToolbarComponent {
  readonly i18n = inject(I18nService);
  readonly store = inject(PaymentRulesCatalogStore);
}
