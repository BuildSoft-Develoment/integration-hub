import { Route } from '@angular/router';
import { AuditSpoolComponent } from '../components/audit-spool/audit-spool.component';
import { RecordLineageComponent } from '../components/record-lineage/record-lineage.component';
import { AuditHubPageComponent } from './audit-hub-page';
import { AuditPageComponent } from './audit-page';

export const auditRoutes: Route[] = [
  // ADR-019 hub de dos niveles: /audit = landing de packs; el log de eventos pasa a /audit/events.
  { path: '', component: AuditHubPageComponent },
  { path: 'events', component: AuditPageComponent },
  { path: 'record-lineage', component: RecordLineageComponent },
  { path: 'spool', component: AuditSpoolComponent },
  // ADR-019 Fase 2: las herramientas MT101 se movieron al pack /swift-mt101/*; los deep-links viejos redirigen.
  { path: 'mt101-fragments', redirectTo: '/swift-mt101/fragments', pathMatch: 'full' },
  { path: 'mt101-quarantine', redirectTo: '/swift-mt101/quarantine', pathMatch: 'full' },
  { path: 'mt101-pay-dispatch', redirectTo: '/swift-mt101/pay-dispatch', pathMatch: 'full' },
  { path: 'mt101-pay-conflicts', redirectTo: '/swift-mt101/pay-conflicts', pathMatch: 'full' },
];
