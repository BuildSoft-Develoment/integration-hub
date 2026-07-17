// @trace spec 008-mensajeria-pagos T-011, T-021, T-026 (registracion de la vertical)
// @trace ADR-009
import { Provider, Type } from '@angular/core';
import { PROCESS_TASK_PROVIDERS } from '../../process-task-provider.token';
import { ProcessTaskFormBridgeService } from '../../tasks/process-task-form-bridge.service';
import {
  PROCESS_TASK_FORM_REGISTRY,
  provideProcessTaskForms,
} from '../../tasks/process-task-form-registry';
import { Mt101ArchiveTaskProvider } from './mt101-archive-task.provider';
import { Mt101BuildFromTableTaskProvider } from './mt101-build-from-table-task.provider';
import { Mt101InboundDeliverTaskProvider } from './mt101-inbound-deliver-task.provider';
import { Mt101ParseFromTableTaskProvider } from './mt101-parse-from-table-task.provider';
import { Mt101ParseTaskProvider } from './mt101-parse-task.provider';
import { Mt101PayTaskProvider } from './mt101-pay-task.provider';
import { Mt101ReconcileTaskProvider } from './mt101-reconcile-task.provider';
import { Mt101RepairTaskProvider } from './mt101-repair-task.provider';
import { Mt101RouteTaskProvider } from './mt101-route-task.provider';
import { Mt101SplitTaskProvider } from './mt101-split-task.provider';
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
  // Sprint 3
  readonly mt101Split: Type<unknown>;
  readonly mt101Repair: Type<unknown>;
}

/**
 * Factory que registra la vertical {@code 008-mensajeria-pagos} sub-catalogo
 * {@code swift/} completa (10 task types tras sprint 3) en el sistema de
 * providers de tareas y de formularios.
 *
 * <p>Patron OCP: el motor (003) no se modifica para anadir la vertical.</p>
 */
export function providePaymentsSwiftForms(components: PaymentsSwiftFormComponents): Provider[] {
  const taskProviderClasses = [
    Mt101BuildFromTableTaskProvider,
    Mt101ValidateTaskProvider,
    Mt101ArchiveTaskProvider,
    Mt101PayTaskProvider,
    Mt101RouteTaskProvider,
    Mt101ReconcileTaskProvider,
    Mt101StatusTaskProvider,
    Mt101ParseTaskProvider,
    Mt101SplitTaskProvider,
    Mt101RepairTaskProvider,
    Mt101ParseFromTableTaskProvider,
    Mt101InboundDeliverTaskProvider,
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
      // El form `mt101Build` es la base compartida de construccion MT101; solo lo
      // usa la ruta paginada (MT101_BUILD ya no se registra como task type).
      { type: 'MT101_BUILD_FROM_TABLE', component: components.mt101Build, layout: 'workspace' },
      { type: 'MT101_VALIDATE',  component: components.mt101Validate,  layout: 'workspace' },
      { type: 'MT101_ARCHIVE',   component: components.mt101Archive,   layout: 'workspace' },
      { type: 'MT101_PAY',       component: components.mt101Pay,       layout: 'workspace' },
      { type: 'MT101_ROUTE',     component: components.mt101Route,     layout: 'workspace' },
      { type: 'MT101_RECONCILE', component: components.mt101Reconcile, layout: 'workspace' },
      { type: 'MT101_STATUS',    component: components.mt101Status,    layout: 'workspace' },
      { type: 'MT101_PARSE',     component: components.mt101Parse,     layout: 'workspace' },
      { type: 'MT101_SPLIT',     component: components.mt101Split,     layout: 'workspace' },
      { type: 'MT101_REPAIR',    component: components.mt101Repair,    layout: 'workspace' },
      // Inbound a escala: reusan el form de PARSE / PAY respectivamente (el config
      // table-driven / transporte lo gestiona el backend; aqui basta render + binding).
      { type: 'MT101_PARSE_FROM_TABLE', component: components.mt101Parse, layout: 'workspace' },
      { type: 'MT101_INBOUND_DELIVER',  component: components.mt101Pay,   layout: 'workspace' },
    ),
  ];
}
