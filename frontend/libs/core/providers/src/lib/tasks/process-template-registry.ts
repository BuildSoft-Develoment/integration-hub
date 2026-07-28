import { InjectionToken, Provider } from '@angular/core';
import { ProcessTaskType } from './process-task.models';

/**
 * ADR-021: una PLANTILLA de proceso aportada por un vertical.
 *
 * <p>El editor sabia armar una cadena completa de MT101: los 6 tipos, sus `taskRef`, sus bindings y
 * hasta valores como `fragmentSetIdTemplate: 'MT101-${_processExecutionId}'` — 74 lineas de un
 * estandar concreto dentro de una store generica. Con esto el editor solo aporta el ENSAMBLADO
 * (defaults del provider + merge + orden + conectores del flujo) y cada vertical aporta el QUE.</p>
 *
 * <p>SBS registra la suya y aparece en el editor sin tocar el motor.</p>
 */
export interface ProcessTemplateTaskSpec {
  taskType: ProcessTaskType;
  /** `taskRef` de la tarea; es como la referencian las demas al encadenarse. */
  ref: string;
  /** Claves que pisan al config por defecto del provider. */
  overrides: Record<string, unknown>;
}

export interface ProcessTemplateRegistration {
  /** Identificador estable de la plantilla (p.ej. `swift-mt101-masivo`). */
  readonly id: string;
  /** Clave i18n del boton/opcion que la ofrece. */
  readonly labelKey: string;
  /** Las tareas, EN ORDEN: el editor las encadena task[i] -> task[i+1]. */
  readonly tasks: readonly ProcessTemplateTaskSpec[];
}

/** Token (multi) donde cada vertical registra sus plantillas de proceso. */
export const PROCESS_TEMPLATE_REGISTRY = new InjectionToken<readonly ProcessTemplateRegistration[]>(
  'PROCESS_TEMPLATE_REGISTRY',
);

export function provideProcessTemplate(registration: ProcessTemplateRegistration): Provider {
  return {
    provide: PROCESS_TEMPLATE_REGISTRY,
    useValue: registration,
    multi: true,
  };
}
