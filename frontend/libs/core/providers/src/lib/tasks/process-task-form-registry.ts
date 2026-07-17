// @trace spec 003-diseno-y-ejecucion-procesos T-016 (M-1b: descubrimiento de formularios)
// @trace ADR-009
import { InjectionToken, Provider, Type } from '@angular/core';
import { ProcessTaskType } from './process-task.models';

/**
 * Registro de formulario de configuracion de una tarea.
 *
 * <p>Permite que cualquier feature vertical (mensajeria de pagos, salud HL7, ACH local,
 * etc.) aporte componentes de formulario para sus propios {@link ProcessTaskType} sin
 * modificar {@code ProcessTaskFormHostComponent} ni el motor (003).</p>
 *
 * <p>Cada registracion se aporta como provider {@code multi: true} al
 * {@link PROCESS_TASK_FORM_REGISTRY}. El host las consulta por
 * {@link ProcessTaskFormRegistration.type} antes de caer al switch legacy.</p>
 */
export interface ProcessTaskFormRegistration {
  /** Tipo de tarea soportado por el componente. */
  readonly type: ProcessTaskType;
  /** Componente standalone del formulario; se instancia via {@code ngComponentOutlet}. */
  readonly component: Type<unknown>;
  /** Pista de layout para el contenedor padre (modal/sidebar). */
  readonly layout?: 'workspace' | 'rest' | 'compact';
}

/**
 * Injection token (multi) donde cada feature vertical registra sus formularios.
 *
 * <p>El host inyecta {@code Instance<ProcessTaskFormRegistration[]>} via
 * {@code inject(PROCESS_TASK_FORM_REGISTRY, { optional: true }) ?? []} y resuelve por
 * {@link ProcessTaskType}.</p>
 */
export const PROCESS_TASK_FORM_REGISTRY = new InjectionToken<readonly ProcessTaskFormRegistration[]>(
  'PROCESS_TASK_FORM_REGISTRY',
);

/**
 * Helper para que una feature aporte UN formulario al registry.
 *
 * <pre>
 *   providers: [
 *     provideProcessTaskForm({ type: 'MT101_BUILD_FROM_TABLE', component: Mt101BuildFormComponent }),
 *   ],
 * </pre>
 */
export function provideProcessTaskForm(registration: ProcessTaskFormRegistration): Provider {
  return {
    provide: PROCESS_TASK_FORM_REGISTRY,
    useValue: registration,
    multi: true,
  };
}

/**
 * Helper para aportar varios formularios en una sola llamada (azucar para verticales
 * con muchos task types como mensajeria de pagos).
 */
export function provideProcessTaskForms(...registrations: ProcessTaskFormRegistration[]): Provider[] {
  return registrations.map(provideProcessTaskForm);
}
