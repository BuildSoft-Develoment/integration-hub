import { Route } from '@angular/router';
import { provideSwiftMt101I18n } from '../../swift-mt101-i18n';
import { PaymentValidationRulesPageComponent } from './payment-validation-rules-page';

/**
 * ADR-021: el catalogo de reglas es del vertical (sus unicos consumidores son MT101, igual que en
 * el backend con `payment_validation_rule`). Registra sus etiquetas porque es un punto de entrada
 * lazy propio: su injector no ve lo que registro el catalogo de procesos.
 */
export const paymentValidationRulesRoutes: Route[] = [
  {
    path: '',
    providers: [...provideSwiftMt101I18n()],
    component: PaymentValidationRulesPageComponent,
  },
];
