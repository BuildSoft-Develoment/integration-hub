import { Provider } from '@angular/core';
import { Route } from '@angular/router';
import { provideProcessTaskProviders } from '@integration-hub/core/providers';
import { provideMotorProcessForms } from '../processes.providers';
import { ProcessCatalogPageComponent } from './process-catalog-page';

/**
 * ADR-021: rutas del catalogo de procesos, parametrizadas por lo que aporte cada VERTICAL.
 *
 * <p>Antes los task providers y los formularios se declaraban en los `providers` del componente,
 * los del motor junto con los de MT101 — lo que obligaba a `features/processes` a conocer el
 * vertical. Ahora los aporta quien ensambla (la app), la unica capa autorizada a ver dos
 * features.</p>
 *
 * <p><b>Por que en la ruta y no en el componente:</b> los multi-providers de Angular NO se fusionan
 * entre injectors — el nivel mas cercano ECLIPSA al de arriba. Si el motor registrara en el
 * componente y el vertical en la ruta, el componente veria SOLO los del motor y los del vertical
 * desaparecerian en silencio. Van todos al mismo nivel; los servicios del componente
 * (`ProcessTaskManagerService` y compania) los resuelven hacia arriba, como cualquier injector
 * hijo.</p>
 *
 * <p>Sigue siendo lazy: estos providers viajan en el chunk de la ruta, no en el bundle inicial.</p>
 *
 * @param verticalProviders lo que cada vertical aporta (task providers + mapeo tipo -> formulario)
 */
export function buildProcessCatalogRoutes(...verticalProviders: Provider[][]): Route[] {
  return [
    {
      path: '',
      component: ProcessCatalogPageComponent,
      providers: [
        // Task providers del motor (serializacion de configuration_json).
        ...provideProcessTaskProviders(),
        // M-1b: formularios del motor (FILE_READ + DB/HTTP/notificacion).
        ...provideMotorProcessForms(),
        // Verticales (SWIFT MT101 hoy, SBS manana): los aporta la app.
        ...verticalProviders.flat(),
      ],
    },
  ];
}

/**
 * Rutas sin ningun vertical: solo el motor. La app usa {@link buildProcessCatalogRoutes} para
 * componer con los verticales que tenga dados de alta.
 */
export const processCatalogRoutes: Route[] = buildProcessCatalogRoutes();
