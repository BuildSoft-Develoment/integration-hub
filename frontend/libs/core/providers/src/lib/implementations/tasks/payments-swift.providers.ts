// @trace spec 008-mensajeria-pagos T-011, T-021 (registracion de la vertical)
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
import { Mt101ParseTaskProvider } from './mt101-parse-task.provider';
import { Mt101PayTaskProvider } from './mt101-pay-task.provider';
import { Mt101ReconcileTaskProvider } from './mt101-reconcile-task.provider';
import { Mt101RouteTaskProvider } from './mt101-route-task.provider';
import { Mt101StatusTaskProvider } from './mt101-status-task.provider';
import { Mt101ValidateTaskProvider } from './mt101-validate-task.provider';

/** Componentes standalone de la vertical 008 sub-catalogo {@code swift/}. */
export interface PaymentsSwiftFormComponents {
  // Sprint 1
  readonly mt101Build: Type<unknown>;
  readonly mt101Validate: Type<unknown>;
  readonly mt101Archive: Type<unknown>;
  readonly mt101Pay: Type<unknown>;
  // Sprint 2
  readonly mt101Route: Type<unknown>;
  readonly mt101Reconcile: Type<unknown>;
  readonly mt101Status: Type<unknown>;
  readonly mt101Parse: Type<unknown>;
}

/**
 * Factory que registra la vertical {@code 008-mensajeria-pagos} sub-catalogo
 * {@code swift/} completa (8 task types tras sprint 2) en el sistema de
 * providers de tareas y de formularios.
 *
 * <p>Registra los 8 task providers en {@link PROCESS_TASK_PROVIDERS}, los 8
 * componentes en {@link PROCESS_TASK_FORM_REGISTRY}, y el
 * {@link ProcessTaskFormBridgeService} compartido.</p>
 *
 * <p>Patron OCP: el motor (003) no se modifica para anadir la vertical.</p>
 */
export function providePaymentsSwiftForms(components: PaymentsSwiftFormComponents): Provider[] {
  const taskProviderClasses = [
    Mt101BuildTaskProvider,
    Mt101ValidateTaskProvider,
    Mt101ArchiveTaskProvider,
    Mt101PayTaskProvider,
    Mt101RouteTaskProvider,
    Mt101ReconcileTaskProvider,
    Mt101StatusTaskProvider,
    Mt101ParseTaskProvider,
  ];
  return [
    // Servicio puente para outputs de formularios dinamicos.
    ProcessTaskFormBridgeService,
    // Task providers (serializacion config_json).
    ...taskProviderClasses,
    ...taskProviderClasses.map((cls) => ({
      provide: PROCESS_TASK_PROVIDERS,
      useExisting: cls,
      multi: true,
    })),
    // Componentes de formulario (UI) - todos con layout workspace.
    ...provideProcessTaskForms(
      { type: 'MT101_BUILD',     component: components.mt101Build,     layout: 'workspace' },
      { type: 'MT101_VALIDATE',  component: components.mt101Validate,  layout: 'workspace' },
      { type: 'MT101_ARCHIVE',   component: components.mt101Archive,   layout: 'workspace' },
      { type: 'MT101_PAY',       component: components.mt101Pay,       layout: 'workspace' },
      { type: 'MT101_ROUTE',     component: components.mt101Route,     layout: 'workspace' },
      { type: 'MT101_RECONCILE', component: components.mt101Reconcile, layout: 'workspace' },
      { type: 'MT101_STATUS',    component: components.mt101Status,    layout: 'workspace' },
      { type: 'MT101_PARSE',     component: components.mt101Parse,     layout: 'workspace' },
    ),
  ];
}
