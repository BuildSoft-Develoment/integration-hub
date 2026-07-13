import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { I18nService } from '@integration-hub/core/services';
import {
  IconComponent,
  ManagedEditorHeaderComponent,
  ManagedEditorSectionComponent,
  ManagedEditorShellComponent,
} from '@integration-hub/shared/ui';

import { PaymentRulesCatalogStore } from '../../catalog/payment-rules-catalog.store';
import { PaymentRulePredicateKind, PaymentRuleSeverity } from '../../models/payment-validation-rule.models';

/**
 * Editor de reglas de pago en el drawer lateral, sobre el shell estándar {@code ih-managed-editor-shell} + header. Dos
 * vistas: {@code edit} (formulario de la regla, con confirmación de sobrescritura al editar) y {@code bulk}
 * (import/export del rule-set). Delega todo el estado y las acciones en el store.
 */
@Component({
  selector: 'ih-payment-rules-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    IconComponent,
    ManagedEditorShellComponent,
    ManagedEditorHeaderComponent,
    ManagedEditorSectionComponent,
  ],
  templateUrl: './payment-rules-editor.component.html',
  styleUrl: './payment-rules-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentRulesEditorComponent {
  readonly i18n = inject(I18nService);
  readonly store = inject(PaymentRulesCatalogStore);

  readonly severityValues: readonly PaymentRuleSeverity[] = ['E', 'W', 'I'];
  readonly predicateKinds: readonly PaymentRulePredicateKind[] = [
    'FIELD_REQUIRED',
    'FIELD_FORBIDDEN',
    'OPTION_ALLOWED',
    'MAX_LENGTH',
    'CURRENCY_ALLOWED',
    'AMOUNT_MAX',
    'CHARGES_ALLOWED',
    'JEXL',
  ];
}
