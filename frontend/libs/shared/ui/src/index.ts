export * from './lib/app-layout/app-layout.component';
export * from './lib/confirm-dialog/confirm-dialog.component';
export * from './lib/app-layout/navigation/app-navigation.models';
export * from './lib/app-layout/navigation/app-navigation.registry';
export * from './lib/app-layout/navigation/app-navigation.token';
export * from './lib/app-layout/plugins/app-action.command';
export * from './lib/app-layout/plugins/app-slot.token';
export * from './lib/app-layout/plugins/slot-outlet.component';
export * from './lib/app-layout/plugins/app-action.confirmation';
export * from './lib/app-layout/plugins/app-action.executor';
export * from './lib/app-layout/plugins/app-action.query';
export * from './lib/app-layout/plugins/app-action.registry';
export * from './lib/app-layout/plugins/app-action.token';
export * from './lib/app-layout/plugins/app-plugin.registry';
export * from './lib/app-layout/plugins/app-plugin-remote.loader';
export * from './lib/app-layout/plugins/app-plugin-remote.verifier';
export * from './lib/app-layout/plugins/app-plugin-runtime.registry';
export * from './lib/app-layout/plugins/app-plugin.routes';
export * from './lib/app-layout/plugins/app-plugin.token';
export * from './lib/app-layout/plugins/app-workspace.registry';
export * from './lib/app-layout/plugins/app-workspace.token';
export * from './lib/app-layout/preferences/app-preferences.facade';
export * from './lib/breadcrumb/breadcrumb.component';
export * from './lib/catalog-list/catalog-list.component';
export * from './lib/schema-form/schema-form.models';
export * from './lib/schema-form/schema-field-renderer';
export * from './lib/schema-form/schema-form.component';
// Primitivas presentacionales: viven en el paquete publicable @integration-hub/plugin-ui-kit
// y se re-exportan aquí para que el barrel interno de la app no cambie (status-badge,
// empty-state, icon, loading + tipos StatusBadgeKind/IhIconName).
export * from '@integration-hub/plugin-ui-kit';
export * from './lib/floating-action-bar/floating-action-bar.component';
export type { ActionBarAction } from './lib/floating-action-bar/floating-action-bar.component';
export * from './lib/info-tile/info-tile.component';
export * from './lib/managed-editor/form-actions/managed-editor-form-actions.component';
export * from './lib/managed-editor/header/managed-editor-header.component';
export * from './lib/managed-editor/managed-editor.models';
export * from './lib/managed-editor/overview/managed-editor-overview.component';
export * from './lib/managed-editor/readonly-actions/managed-editor-readonly-actions.component';
export * from './lib/managed-editor/section/managed-editor-section.component';
export * from './lib/managed-editor/shell/managed-editor-shell.component';
export * from './lib/managed-editor/test-result/managed-editor-test-result.component';
export * from './lib/actions/action-dispatcher.service';
export * from './lib/duration-input/duration-input.component';
export * from './lib/suggest-input/suggest-input.component';
export * from './lib/pipes/relative-time.pipe';
// §Fase0: los contratos de presentación (ResourcePresentation, IhBreadcrumbItem) viven ahora en la leaf
// @integration-hub/shared/models y el snackbar en @integration-hub/plugin-ui-kit (ya re-exportado arriba),
// para romper el ciclo shared/ui ↔ core/services. Se re-exportan aquí para no cambiar la API del barrel.
export * from '@integration-hub/shared/models';
export * from './lib/secret-reference-field/secret-reference-field.component';
