import { Route } from '@angular/router';
import { AsyncDlqComponent } from '../components/async-dlq/async-dlq.component';
import { ExecutionCatalogPageComponent } from './execution-catalog-page';

export const executionCatalogRoutes: Route[] = [
  {
    path: '',
    component: ExecutionCatalogPageComponent,
  },
  {
    // Consola de operaciones DLQ del backbone async (ADR-015). Reads abiertos a la sección;
    // acciones mutantes gateadas a admin en la UI y el backend.
    path: 'async-dlq',
    component: AsyncDlqComponent,
  },
];
