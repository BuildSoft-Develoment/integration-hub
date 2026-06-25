import { IhIconName } from '../icon/icon.component';

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
