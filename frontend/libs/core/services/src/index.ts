export * from './lib/auth/auth.guard';
export * from './lib/auth/auth.interceptor';
export * from './lib/infrastructure/http-error.interceptor';
export * from './lib/ui/app-feedback.service';
export * from './lib/auth/auth-access.service';
export * from './lib/auth/auth.service';
export * from './lib/infrastructure/date-time.service';
export * from './lib/infrastructure/file-export';
export * from './lib/managers/connection-manager.service';
export * from './lib/managers/managed-editor-state.base';
export * from './lib/managers/process-task-manager.service';
export * from './lib/managers/reader-manager.service';
export * from './lib/managers/source-manager.service';
export * from './lib/ui/theme.service';
export * from './lib/ui/system-theme-config.service';
// §Fase1: I18nService vive ahora en la leaf @integration-hub/core/i18n (rompe el ciclo
// core/providers ↔ core/services: providers usa i18n sin subir a la capa de services). Se re-exporta
// aquí para no cambiar la API del barrel (los ~106 consumidores de features/app siguen igual).
export * from '@integration-hub/core/i18n';
export * from './lib/infrastructure/paginator-intl.service';
export * from './lib/ui/ui-message.service';
export * from './lib/ui/breadcrumb.service';
export * from './lib/ui/i18n-title.strategy';
export * from './lib/ui/table-preferences.service';
export * from './lib/ui/sort-utils';
export * from './lib/execution/process-execution-api.service';
