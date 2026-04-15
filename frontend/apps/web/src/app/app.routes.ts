import { Route } from '@angular/router';
import { authGuard, roleGuard } from '@integration-hub/core/services';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'overview',
  },
  {
    path: 'overview',
    canActivate: [
      authGuard,
      roleGuard(['platform-admin', 'integration-admin', 'operator', 'auditor']),
    ],
    loadChildren: () =>
      import('@integration-hub/features/overview').then(
        (module) => module.overviewRoutes
      ),
  },
  {
    path: 'sources',
    canActivate: [
      authGuard,
      roleGuard(['platform-admin', 'integration-admin', 'auditor']),
    ],
    loadChildren: () =>
      import('@integration-hub/features/sources').then(
        (module) => module.sourceCatalogRoutes
      ),
  },
  {
    path: 'connections',
    canActivate: [
      authGuard,
      roleGuard(['platform-admin', 'integration-admin', 'auditor']),
    ],
    loadChildren: () =>
      import('@integration-hub/features/connections').then(
        (module) => module.connectionCatalogRoutes
      ),
  },
  {
    path: 'readers',
    canActivate: [
      authGuard,
      roleGuard(['platform-admin', 'integration-admin', 'auditor']),
    ],
    loadChildren: () =>
      import('@integration-hub/features/readers').then(
        (module) => module.readerCatalogRoutes
      ),
  },
  {
    path: 'processes',
    canActivate: [
      authGuard,
      roleGuard(['platform-admin', 'integration-admin', 'operator', 'auditor']),
    ],
    loadChildren: () =>
      import('@integration-hub/features/processes').then(
        (module) => module.processCatalogRoutes
      ),
  },
  {
    path: 'executions',
    canActivate: [
      authGuard,
      roleGuard(['platform-admin', 'integration-admin', 'operator', 'auditor']),
    ],
    loadChildren: () =>
      import('@integration-hub/features/executions').then(
        (module) => module.executionCatalogRoutes
      ),
  },
  {
    path: 'schedules',
    canActivate: [
      authGuard,
      roleGuard(['platform-admin', 'integration-admin', 'operator', 'auditor']),
    ],
    loadChildren: () =>
      import('@integration-hub/features/schedules').then(
        (module) => module.schedulesRoutes
      ),
  },
  {
    path: 'audit',
    canActivate: [
      authGuard,
      roleGuard(['platform-admin', 'integration-admin', 'operator', 'auditor']),
    ],
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
