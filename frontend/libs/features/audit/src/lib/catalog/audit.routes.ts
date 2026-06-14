import { Route } from '@angular/router';
import { AuditSpoolComponent } from '../components/audit-spool/audit-spool.component';
import { Mt101FragmentLookupComponent } from '../components/mt101-fragment-lookup/mt101-fragment-lookup.component';
import { RecordLineageComponent } from '../components/record-lineage/record-lineage.component';
import { AuditPageComponent } from './audit-page';

export const auditRoutes: Route[] = [
  {
    path: '',
    component: AuditPageComponent,
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
];
