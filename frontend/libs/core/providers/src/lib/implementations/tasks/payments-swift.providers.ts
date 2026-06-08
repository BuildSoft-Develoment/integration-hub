// @trace spec 008-mensajeria-pagos T-011 (registracion de la vertical)
// @trace ADR-009
import { Provider, Type } from '@angular/core';
import { PROCESS_TASK_PROVIDERS } from '../../process-task-provider.token';
import { ProcessTaskFormBridgeService } from '../../tasks/process-task-form-bridge.service';
import {
  PROCESS_TASK_FORM_REGISTRY,
  provideProcessTaskForms,
} from '../../tasks/process-task-form-registry';
import { Mt101ArchiveTaskProvider } from './mt101-archive-task.provider';
import { Mt101BuildTaskProvider } from './mt101-build-task.provider';
import { Mt101PayTaskProvider } from './mt101-pay-task.provider';
import { Mt101ValidateTaskProvider } from './mt101-validate-task.provider';

/** Componentes standalone de la vertical 008 sub-catalogo {@code swift/}. */
export interface PaymentsSwiftFormComponents {
  readonly mt101Build: Type<unknown>;
  readonly mt101Validate: Type<unknown>;
  readonly mt101Archive: Type<unknown>;
  readonly mt101Pay: Type<unknown>;
}

/**
 * Factory que registra la vertical {@code 008-mensajeria-pagos} sub-catalogo
 * {@code swift/} completa en el sistema de providers de tareas y de formularios.
 *
 * <p>Registra los 4 task providers en {@link PROCESS_TASK_PROVIDERS}, los 4
 * componentes en {@link PROCESS_TASK_FORM_REGISTRY}, y el
 * {@link ProcessTaskFormBridgeService} compartido.</p>
 *
 * <p>Patron OCP: el motor (003) no se modifica para anadir la vertical. Una nueva
 * vertical (HL7, ACH local, ISO 20022) solo agrega su propio
 * {@code provideXxxForms()} en el bootstrap.</p>
 *
 * <p>Los componentes se pasan como argumentos para evitar dependencia circular: este
 * archivo vive en {@code core/providers} y no debe importar componentes de
 * {@code features/processes}.</p>
 */
export function providePaymentsSwiftForms(components: PaymentsSwiftFormComponents): Provider[] {
  return [
    // Servicio puente para outputs de formularios dinamicos.
    ProcessTaskFormBridgeService,
    // Task providers (serializacion config_json).
    Mt101BuildTaskProvider,
    Mt101ValidateTaskProvider,
    Mt101ArchiveTaskProvider,
    Mt101PayTaskProvider,
    {
      provide: PROCESS_TASK_PROVIDERS,
      useExisting: Mt101BuildTaskProvider,
      multi: true,
    },
    {
      provide: PROCESS_TASK_PROVIDERS,
      useExisting: Mt101ValidateTaskProvider,
      multi: true,
    },
    {
      provide: PROCESS_TASK_PROVIDERS,
      useExisting: Mt101ArchiveTaskProvider,
      multi: true,
    },
    {
      provide: PROCESS_TASK_PROVIDERS,
      useExisting: Mt101PayTaskProvider,
      multi: true,
    },
    // Componentes de formulario (UI) — 4 forms, todos con layout workspace.
    ...provideProcessTaskForms(
      { type: 'MT101_BUILD',    component: components.mt101Build,    layout: 'workspace' },
      { type: 'MT101_VALIDATE', component: components.mt101Validate, layout: 'workspace' },
      { type: 'MT101_ARCHIVE', component: components.mt101Archive, layout: 'workspace' },
      { type: 'MT101_PAY',     component: components.mt101Pay,     layout: 'workspace' },
    ),
  ];
}
