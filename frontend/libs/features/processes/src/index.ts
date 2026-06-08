export * from './lib/catalog/process-catalog.routes';
export * from './lib/api/process-api.service';
// --- M-1b: registracion del motor en PROCESS_TASK_FORM_REGISTRY ---
export * from './lib/processes.providers';
// --- Componentes de la vertical 008 — exportados para que el bootstrap los
//     pase a providePaymentsSwiftForms(). ---
export * from './lib/components/process-task-form/process-mt101-build-task-form/process-mt101-build-task-form.component';
export * from './lib/components/process-task-form/process-mt101-validate-task-form/process-mt101-validate-task-form.component';
export * from './lib/components/process-task-form/process-mt101-archive-task-form/process-mt101-archive-task-form.component';
export * from './lib/components/process-task-form/process-mt101-pay-task-form/process-mt101-pay-task-form.component';
export * from './lib/components/process-task-form/process-mt101-route-task-form/process-mt101-route-task-form.component';
export * from './lib/components/process-task-form/process-mt101-reconcile-task-form/process-mt101-reconcile-task-form.component';
export * from './lib/components/process-task-form/process-mt101-status-task-form/process-mt101-status-task-form.component';
export * from './lib/components/process-task-form/process-mt101-parse-task-form/process-mt101-parse-task-form.component';
export * from './lib/components/process-task-form/process-mt101-split-task-form/process-mt101-split-task-form.component';
export * from './lib/components/process-task-form/process-mt101-repair-task-form/process-mt101-repair-task-form.component';
