import { Route } from '@angular/router';
import { provideSwiftMt101I18n } from './swift-mt101-i18n';
import { Mt101FragmentLookupComponent } from './components/mt101-fragment-lookup/mt101-fragment-lookup.component';
import { Mt101QuarantineComponent } from './components/mt101-quarantine/mt101-quarantine.component';
import { Mt101PayDispatchComponent } from './components/mt101-pay-dispatch/mt101-pay-dispatch.component';
import { Mt101PayConflictsComponent } from './components/mt101-pay-conflicts/mt101-pay-conflicts.component';

/**
 * Rutas del pack SWIFT MT101 (ADR-019 Fase 2): namespace propio `/swift-mt101/*`, separado del core de
 * auditoria. El hub de auditoria enlaza aca por dominio; los deep-links viejos `/audit/mt101-*` redirigen.
 *
 * <p>ADR-021: la ruta PADRE aporta las etiquetas del vertical. Van ahi y no en el `redirectTo` — una
 * ruta de redireccion nunca activa nada, asi que sus providers no llegan a crearse. Y van tambien en
 * el catalogo de procesos y en el de reglas: cada ruta lazy tiene su propio injector, asi que
 * registrar en una sola dejaria a las otras mostrando la clave cruda.</p>
 */
export const swiftMt101Routes: Route[] = [
  {
    path: '',
    providers: [...provideSwiftMt101I18n()],
    children: [
      { path: '', redirectTo: 'fragments', pathMatch: 'full' },
      { path: 'fragments', component: Mt101FragmentLookupComponent },
      { path: 'quarantine', component: Mt101QuarantineComponent },
      { path: 'pay-dispatch', component: Mt101PayDispatchComponent },
      { path: 'pay-conflicts', component: Mt101PayConflictsComponent },
    ],
  },
];
