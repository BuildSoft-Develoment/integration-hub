import { Route } from '@angular/router';
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
];
