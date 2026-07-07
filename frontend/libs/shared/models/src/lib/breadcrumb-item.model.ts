import { Params } from '@angular/router';

/**
 * Ítem de migas de pan (breadcrumb). Tipo de datos puro que consumen tanto
 * {@code shared/ui} (el {@code BreadcrumbComponent} que lo renderiza) como
 * {@code core/services} (el {@code BreadcrumbService} que los publica). Vive en
 * la leaf {@code @integration-hub/shared/models} para no crear un ciclo de
 * proyectos entre esas dos libs.
 */
export interface IhBreadcrumbItem {
  /** Texto ya traducido (el consumidor resuelve i18n). */
  label: string;
  /** RouterLink destino; si falta o es el último, se muestra como texto plano. */
  link?: unknown[];
  queryParams?: Params;
}
