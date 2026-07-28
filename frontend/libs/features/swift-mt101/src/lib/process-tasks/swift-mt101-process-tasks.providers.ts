// @trace spec 008-mensajeria-pagos T-011, T-021, T-026 (registracion de la vertical)
// @trace ADR-009
import { Provider } from '@angular/core';
import { provideSwiftMt101ProcessTemplate } from './swift-mt101-process-template';
import { PROCESS_TASK_PROVIDERS } from '@integration-hub/core/providers';
import { ProcessTaskFormBridgeService } from '@integration-hub/core/providers';
import {
  PROCESS_TASK_FORM_REGISTRY,
  provideProcessTaskForms,
} from '@integration-hub/core/providers';
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
import { ProcessMt101ArchiveTaskFormComponent } from '../process-task-forms/process-mt101-archive-task-form/process-mt101-archive-task-form.component';
import { ProcessMt101BuildTaskFormComponent } from '../process-task-forms/process-mt101-build-task-form/process-mt101-build-task-form.component';
import { ProcessMt101InboundDeliverTaskFormComponent } from '../process-task-forms/process-mt101-inbound-deliver-task-form/process-mt101-inbound-deliver-task-form.component';
import { ProcessMt101ParseFromTableTaskFormComponent } from '../process-task-forms/process-mt101-parse-from-table-task-form/process-mt101-parse-from-table-task-form.component';
import { ProcessMt101ParseTaskFormComponent } from '../process-task-forms/process-mt101-parse-task-form/process-mt101-parse-task-form.component';
import { ProcessMt101PayTaskFormComponent } from '../process-task-forms/process-mt101-pay-task-form/process-mt101-pay-task-form.component';
import { ProcessMt101ReconcileTaskFormComponent } from '../process-task-forms/process-mt101-reconcile-task-form/process-mt101-reconcile-task-form.component';
import { ProcessMt101RepairTaskFormComponent } from '../process-task-forms/process-mt101-repair-task-form/process-mt101-repair-task-form.component';
import { ProcessMt101RouteTaskFormComponent } from '../process-task-forms/process-mt101-route-task-form/process-mt101-route-task-form.component';
import { ProcessMt101SplitTaskFormComponent } from '../process-task-forms/process-mt101-split-task-form/process-mt101-split-task-form.component';
import { ProcessMt101StatusTaskFormComponent } from '../process-task-forms/process-mt101-status-task-form/process-mt101-status-task-form.component';
import { ProcessMt101ValidateTaskFormComponent } from '../process-task-forms/process-mt101-validate-task-form/process-mt101-validate-task-form.component';

/**
 * Factory que registra la vertical {@code 008-mensajeria-pagos} sub-catalogo
 * {@code swift/} completa (10 task types tras sprint 3) en el sistema de
 * providers de tareas y de formularios.
 *
 * <p>Patron OCP: el motor (003) no se modifica para anadir la vertical.</p>
 */
export function provideSwiftMt101ProcessTasks(): Provider[] {
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
    // ADR-021: la cadena masiva, aportada por el vertical (antes vivia en la store del editor).
    ...provideSwiftMt101ProcessTemplate(),
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
      { type: 'MT101_BUILD_FROM_TABLE', component: ProcessMt101BuildTaskFormComponent, layout: 'workspace' },
      { type: 'MT101_VALIDATE',  component: ProcessMt101ValidateTaskFormComponent,  layout: 'workspace' },
      { type: 'MT101_ARCHIVE',   component: ProcessMt101ArchiveTaskFormComponent,   layout: 'workspace' },
      { type: 'MT101_PAY',       component: ProcessMt101PayTaskFormComponent,       layout: 'workspace' },
      { type: 'MT101_ROUTE',     component: ProcessMt101RouteTaskFormComponent,     layout: 'workspace' },
      { type: 'MT101_RECONCILE', component: ProcessMt101ReconcileTaskFormComponent, layout: 'workspace' },
      { type: 'MT101_STATUS',    component: ProcessMt101StatusTaskFormComponent,    layout: 'workspace' },
      { type: 'MT101_PARSE',     component: ProcessMt101ParseTaskFormComponent,     layout: 'workspace' },
      { type: 'MT101_SPLIT',     component: ProcessMt101SplitTaskFormComponent,     layout: 'workspace' },
      { type: 'MT101_REPAIR',    component: ProcessMt101RepairTaskFormComponent,    layout: 'workspace' },
      // Inbound a escala: reusan el form de PARSE / PAY respectivamente (el config
      // table-driven / transporte lo gestiona el backend; aqui basta render + binding).
      { type: 'MT101_PARSE_FROM_TABLE', component: ProcessMt101ParseFromTableTaskFormComponent, layout: 'workspace' },
      { type: 'MT101_INBOUND_DELIVER',  component: ProcessMt101InboundDeliverTaskFormComponent, layout: 'workspace' },
    ),
  ];
}
