import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';

import { PaymentRulesEditorComponent } from '../components/payment-rules-editor/payment-rules-editor.component';
import { PaymentRulesListComponent } from '../components/payment-rules-list/payment-rules-list.component';
import { PaymentRulesToolbarComponent } from '../components/payment-rules-toolbar/payment-rules-toolbar.component';
import { PaymentRulesCatalogStore } from './payment-rules-catalog.store';

/**
 * Pantalla de reglas de validación de pagos, alineada al design system estándar {@code ih-catalog-*} (grid + toolbar +
 * lista + editor en drawer lateral), espejo de {@code SourceCatalogPageComponent}. Provee el store del catálogo y solo
 * compone los sub-componentes de presentación; la lógica vive en {@link PaymentRulesCatalogStore}.
 */
@Component({
  selector: 'ih-payment-validation-rules-page',
  standalone: true,
  providers: [PaymentRulesCatalogStore],
  imports: [
    CommonModule,
    MatSidenavModule,
    PaymentRulesToolbarComponent,
    PaymentRulesListComponent,
    PaymentRulesEditorComponent,
  ],
  templateUrl: './payment-validation-rules-page.html',
  styleUrl: './payment-validation-rules-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentValidationRulesPageComponent implements OnInit, OnDestroy {
  readonly store = inject(PaymentRulesCatalogStore);

  ngOnInit(): void {
    void this.store.load();
  }

  ngOnDestroy(): void {
    this.store.destroy();
  }
}
