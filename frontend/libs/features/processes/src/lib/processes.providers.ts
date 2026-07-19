// @trace spec 003-diseno-y-ejecucion-procesos T-016 (M-1b: registracion del motor)
// @trace ADR-009
import { Provider } from '@angular/core';
import {
  ProcessTaskFormBridgeService,
  provideProcessTaskForms,
} from '@integration-hub/core/providers';
import { ProcessDbExecuteFnTaskFormComponent } from './components/process-task-form/process-db-execute-fn-task-form/process-db-execute-fn-task-form.component';
import { ProcessDbExecuteSpTaskFormComponent } from './components/process-task-form/process-db-execute-sp-task-form/process-db-execute-sp-task-form.component';
import { ProcessDbWriteTaskFormComponent } from './components/process-task-form/process-db-write-task-form/process-db-write-task-form.component';
import { ProcessFileCompressTaskFormComponent } from './components/process-task-form/process-file-compress-task-form/process-file-compress-task-form.component';
import { ProcessFileDeliverTaskFormComponent } from './components/process-task-form/process-file-deliver-task-form/process-file-deliver-task-form.component';
import { ProcessFileReadTaskFormComponent } from './components/process-task-form/process-file-read-task-form/process-file-read-task-form.component';
import { ProcessFileWriteTaskFormComponent } from './components/process-task-form/process-file-write-task-form/process-file-write-task-form.component';
import { ProcessNotificationTaskFormComponent } from './components/process-task-form/process-notification-task-form/process-notification-task-form.component';
import { ProcessRestCallTaskFormComponent } from './components/process-task-form/process-rest-call-task-form/process-rest-call-task-form.component';

/**
 * Registra los formularios del motor (spec 003) en {@code PROCESS_TASK_FORM_REGISTRY}.
 *
 * <p>Bootstrap canonico:</p>
 * <pre>
 *   provideProcessTaskProviders(),                                       // task providers motor
 *   ...provideMotorProcessForms(),                                       // form components motor (6)
 *   ...providePaymentsSwiftForms(ProcessMt101BuildTaskFormComponent),    // vertical 008
 * </pre>
 *
 * <p>Sin fallback legacy: cada {@code ProcessTaskType} built-in tiene su formulario explícito.
 * Un tipo sin form registrado pero con config-schema del backend (aportado por un plugin) lo
 * resuelve el host con {@code ih-schema-form}; uno sin form ni schema falla explícito. No hay
 * editor JSON crudo genérico.</p>
 */
export function provideMotorProcessForms(): Provider[] {
  return [
    // Bridge compartido entre todos los formularios y el host.
    ProcessTaskFormBridgeService,
    ...provideProcessTaskForms(
      { type: 'FILE_READ', component: ProcessFileReadTaskFormComponent },
      { type: 'DB_WRITE', component: ProcessDbWriteTaskFormComponent, layout: 'workspace' },
      { type: 'DB_EXECUTE_SP', component: ProcessDbExecuteSpTaskFormComponent, layout: 'workspace' },
      { type: 'DB_EXECUTE_FN', component: ProcessDbExecuteFnTaskFormComponent, layout: 'workspace' },
      { type: 'REST_CALL', component: ProcessRestCallTaskFormComponent, layout: 'workspace' },
      { type: 'NOTIFICATION', component: ProcessNotificationTaskFormComponent, layout: 'workspace' },
      { type: 'FILE_WRITE', component: ProcessFileWriteTaskFormComponent, layout: 'workspace' },
      { type: 'FILE_COMPRESS', component: ProcessFileCompressTaskFormComponent, layout: 'workspace' },
      { type: 'FILE_DELIVER', component: ProcessFileDeliverTaskFormComponent, layout: 'workspace' },
    ),
  ];
}
