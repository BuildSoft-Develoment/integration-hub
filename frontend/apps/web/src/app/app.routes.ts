import { Route } from '@angular/router';

import { appSectionGuard } from './core/app-route-access.policy';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'overview',
  },
  {
    path: 'overview',
    canActivate: [appSectionGuard('overview')],
    loadChildren: () =>
      import('@integration-hub/features/overview').then(
        (module) => module.overviewRoutes
      ),
  },
  {
    path: 'sources',
    canActivate: [appSectionGuard('sources')],
    loadChildren: () =>
      import('@integration-hub/features/sources').then(
        (module) => module.sourceCatalogRoutes
      ),
  },
  {
    path: 'connections',
    canActivate: [appSectionGuard('connections')],
    loadChildren: () =>
      import('@integration-hub/features/connections').then(
        (module) => module.connectionCatalogRoutes
      ),
  },
  {
    path: 'readers',
    canActivate: [appSectionGuard('readers')],
    loadChildren: () =>
      import('@integration-hub/features/readers').then(
        (module) => module.readerCatalogRoutes
      ),
  },
  {
    path: 'processes',
    canActivate: [appSectionGuard('processes')],
    loadChildren: () =>
      import('@integration-hub/features/processes').then(
        (module) => module.processCatalogRoutes
      ),
  },
  {
    path: 'executions',
    canActivate: [appSectionGuard('executions')],
    loadChildren: () =>
      import('@integration-hub/features/executions').then(
        (module) => module.executionCatalogRoutes
      ),
  },
  {
    path: 'schedules',
    canActivate: [appSectionGuard('schedules')],
    loadChildren: () =>
      import('@integration-hub/features/schedules').then(
        (module) => module.schedulesRoutes
      ),
  },
  {
    path: 'audit',
    canActivate: [appSectionGuard('audit')],
    loadChildren: () =>
      import('@integration-hub/features/audit').then(
        (module) => module.auditRoutes
      ),
  },
  {
    path: '**',
    redirectTo: 'overview',
  },
];
