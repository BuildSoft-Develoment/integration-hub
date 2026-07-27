import { IhIconName } from '@integration-hub/plugin-ui-kit';

/**
 * Contrato visual transversal para representar un tipo de recurso (conexion,
 * fuente, lector, tarea, estado) de forma consistente en catalogos, avatares y
 * chips.
 *
 * <p>Politica no-fallback: el consumidor SIEMPRE recibe una presentacion
 * concreta. No hay icono/tono por defecto; cada dominio declara un mapa total
 * (`Record<Type, ResourcePresentation>`) y TypeScript exige cubrir todas las
 * variantes del tipo. Un valor sin entrada es error de compilacion, no un
 * respaldo en runtime.</p>
 *
 * <p>Vive en la leaf {@code @integration-hub/shared/models} (solo tipos, sin
 * dependencias a otras libs salvo la primitiva de iconos) para que tanto
 * {@code core/services} como {@code shared/ui} la consuman sin crear un ciclo
 * de proyectos (prerequisito de registrar las libs como proyectos Nx).</p>
 */
export interface ResourcePresentation {
  /** Icono del catalogo `IhIconName` (sin webfont externa). */
  icon: IhIconName;
  /**
   * Clase tonal del Design System (tokens `--ih-*`). Define el color del avatar
   * o chip. No se permiten colores literales.
   */
  toneClass: string;
}

/**
 * ADR-021: presentacion de un nodo en el editor de flujo (badge + icono SVG propio). Vive aca
 * — y no en {@code features/processes} — para que un provider pueda DECLARARLA en su descriptor:
 * {@code core/providers} puede depender de {@code shared/models}, pero no de una feature.
 *
 * <p>Asi un vertical nuevo aporta sus visuales sin editar los mapas del motor. Si no la declara,
 * el editor usa su mapa por defecto y, en ultima instancia, la presentacion generica.</p>
 */
export interface ProcessFlowNodePresentation {
  /** Texto corto del nodo (2-6 caracteres). */
  badge: string;
  /** Clase tonal del nodo (tokens `--ih-*`). */
  toneClass: string;
  /** Path del SVG (viewBox 0 0 24 24), en linea: el proyecto no carga webfonts de iconos. */
  iconPath: string;
}
