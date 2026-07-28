import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageEvent } from '@angular/material/paginator';
import { I18nService } from '@integration-hub/core/services';
import { CatalogListColumn, CatalogListComponent, IconComponent } from '@integration-hub/shared/ui';

import { PaymentRulesCatalogStore } from '../../catalog/payment-rules-catalog.store';
import { PaymentRuleSeverity } from '../../models/payment-validation-rule.models';

const SEVERITY_CHIP: Record<PaymentRuleSeverity, { labelKey: string; chipClass: string }> = {
  E: { labelKey: 'paymentRules.severityError', chipClass: 'severity-ch--error' },
  W: { labelKey: 'paymentRules.severityWarn', chipClass: 'severity-ch--warn' },
  I: { labelKey: 'paymentRules.severityInfo', chipClass: 'severity-ch--info' },
};

/**
 * Lista del catálogo de reglas de pago sobre el shell compartido {@code ih-catalog-list} (header, estados
 * loading/error/empty, paginación y navegación por teclado), con filas proyectadas al estilo {@code ih-catalog-table-row}.
 */
@Component({
  selector: 'ih-payment-rules-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatChipsModule, MatTooltipModule, CatalogListComponent, IconComponent],
  templateUrl: './payment-rules-list.component.html',
  styleUrl: './payment-rules-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentRulesListComponent {
  readonly i18n = inject(I18nService);
  readonly store = inject(PaymentRulesCatalogStore);

  readonly columns: readonly CatalogListColumn[] = [
    { labelKey: 'paymentRules.code' },
    { labelKey: 'paymentRules.predicateKind' },
    { labelKey: 'paymentRules.severity' },
    { labelKey: 'common.status' },
    { labelKey: 'common.actions' },
  ];

  readonly pageSizeOptions: readonly number[] = [10, 25, 50];

  severityLabel(severity: PaymentRuleSeverity): string {
    return this.i18n.t(SEVERITY_CHIP[severity].labelKey);
  }

  severityChipClass(severity: PaymentRuleSeverity): string {
    return SEVERITY_CHIP[severity].chipClass;
  }

  onPageChange(event: PageEvent): void {
    this.store.onPage(event);
  }
}
