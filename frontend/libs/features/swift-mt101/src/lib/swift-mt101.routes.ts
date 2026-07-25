import { Route } from '@angular/router';
import { Mt101FragmentLookupComponent } from './components/mt101-fragment-lookup/mt101-fragment-lookup.component';
import { Mt101QuarantineComponent } from './components/mt101-quarantine/mt101-quarantine.component';
import { Mt101PayDispatchComponent } from './components/mt101-pay-dispatch/mt101-pay-dispatch.component';
import { Mt101PayConflictsComponent } from './components/mt101-pay-conflicts/mt101-pay-conflicts.component';

/**
 * Rutas del pack SWIFT MT101 (ADR-019 Fase 2): namespace propio `/swift-mt101/*`, separado del core de
 * auditoria. El hub de auditoria enlaza aca por dominio; los deep-links viejos `/audit/mt101-*` redirigen.
 */
export const swiftMt101Routes: Route[] = [
  { path: '', redirectTo: 'fragments', pathMatch: 'full' },
  { path: 'fragments', component: Mt101FragmentLookupComponent },
  { path: 'quarantine', component: Mt101QuarantineComponent },
  { path: 'pay-dispatch', component: Mt101PayDispatchComponent },
  { path: 'pay-conflicts', component: Mt101PayConflictsComponent },
];
