import { Route } from '@angular/router';
import { AuditSpoolComponent } from '../components/audit-spool/audit-spool.component';
import { Mt101FragmentLookupComponent } from '../components/mt101-fragment-lookup/mt101-fragment-lookup.component';
import { Mt101PayConflictsComponent } from '../components/mt101-pay-conflicts/mt101-pay-conflicts.component';
import { Mt101PayDispatchComponent } from '../components/mt101-pay-dispatch/mt101-pay-dispatch.component';
import { Mt101QuarantineComponent } from '../components/mt101-quarantine/mt101-quarantine.component';
import { RecordLineageComponent } from '../components/record-lineage/record-lineage.component';
import { AuditPageComponent } from './audit-page';

export const auditRoutes: Route[] = [
  {
    path: '',
    component: AuditPageComponent,
  },
  {
    path: 'events',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'record-lineage',
    component: RecordLineageComponent,
  },
  {
    path: 'spool',
    component: AuditSpoolComponent,
  },
  {
    path: 'mt101-fragments',
    component: Mt101FragmentLookupComponent,
  },
  {
    path: 'mt101-quarantine',
    component: Mt101QuarantineComponent,
  },
  {
    path: 'mt101-pay-dispatch',
    component: Mt101PayDispatchComponent,
  },
  {
    path: 'mt101-pay-conflicts',
    component: Mt101PayConflictsComponent,
  },
];
