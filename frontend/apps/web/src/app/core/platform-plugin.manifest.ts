import { Provider } from '@angular/core';
import { Routes } from '@angular/router';
import {
  AppPluginManifest,
  AppRouteContribution,
  FRONTEND_EXTENSION_PLATFORM_VERSION,
} from '@integration-hub/shared/ui';

import { APP_NAVIGATION_DEFINITIONS } from './app-navigation.policy';
import { APP_SECTION_CAPABILITIES } from './app-section-access.policy';

/**
 * Envuelve las rutas de una seccion del motor con los proveedores de vocabulario de los verticales.
 *
 * <p>La app es la unica capa que puede ver dos features a la vez (la frontera Nx prohibe
 * feature -> feature), asi que el ensamblado vive aqui. Se anade una ruta padre sin componente cuyo
 * unico cometido es sostener los proveedores: los hijos heredan el injector y las secciones no se
 * enteran de que existen verticales, que es justo la inversion que pide ADR-021.</p>
 *
 * <p>Dar de alta un vertical nuevo es sumar su `provide...()` a la lista de la seccion. Si algun dia
 * son varios, esto se convierte en un bucle; con uno solo, un bucle seria adorno.</p>
 */
function conVocabulario(rutas: Routes, proveedores: Provider[]): Routes {
  return [{ path: '', providers: proveedores, children: rutas }];
}

export const PLATFORM_ROUTE_CONTRIBUTIONS: readonly AppRouteContribution[] = [
  {
    id: 'overview',
    path: '/overview',
    titleKey: 'overview.title',
    requiredCapability: APP_SECTION_CAPABILITIES.overview,
    // Overview lista ejecuciones y eventos de CUALQUIER vertical, asi que necesita su vocabulario.
    // Se carga el punto de entrada estrecho, no el barril: entra el mapa de etiquetas, no la consola.
    loadChildren: () =>
      Promise.all([
        import('@integration-hub/features/overview'),
        import('@integration-hub/features/swift-mt101/vocabulary'),
      ]).then(([overview, vocabulario]) =>
        conVocabulario(overview.overviewRoutes, vocabulario.provideSwiftMt101I18n())
      ),
  },
  {
    id: 'sources',
    path: '/sources',
    titleKey: 'sources.title',
    requiredCapability: APP_SECTION_CAPABILITIES.sources,
    loadChildren: () =>
      import('@integration-hub/features/sources').then(
        (module) => module.sourceCatalogRoutes
      ),
  },
  {
    id: 'connections',
    path: '/connections',
    titleKey: 'connections.title',
    requiredCapability: APP_SECTION_CAPABILITIES.connections,
    loadChildren: () =>
      import('@integration-hub/features/connections').then(
        (module) => module.connectionCatalogRoutes
      ),
  },
  {
    id: 'readers',
    path: '/readers',
    titleKey: 'readers.title',
    requiredCapability: APP_SECTION_CAPABILITIES.readers,
    loadChildren: () =>
      import('@integration-hub/features/readers').then(
        (module) => module.readerCatalogRoutes
      ),
  },
  {
    id: 'processes',
    path: '/processes',
    titleKey: 'processes.title',
    requiredCapability: APP_SECTION_CAPABILITIES.processes,
    // ADR-021: la APP ensambla el catalogo con lo que aporta cada vertical. Es la unica capa que
    // puede ver dos features a la vez (feature -> feature esta prohibido por las fronteras Nx), y
    // por eso el cableado vive aca y no dentro de `features/processes`. Dar de alta SBS es agregar
    // un import y su `provideSbs...()` — sin tocar el motor.
    //
    // Los dos imports estan DENTRO de loadChildren: el vertical viaja en el chunk de la ruta, no
    // en el bundle inicial.
    loadChildren: () =>
      Promise.all([
        import('@integration-hub/features/processes'),
        import('@integration-hub/features/swift-mt101'),
      ]).then(([processes, swiftMt101]) =>
        processes.buildProcessCatalogRoutes(swiftMt101.provideSwiftMt101ProcessTasks())
      ),
  },
  {
    id: 'paymentRules',
    path: '/payment-rules',
    titleKey: 'paymentRules.title',
    requiredCapability: APP_SECTION_CAPABILITIES.paymentRules,
    loadChildren: () =>
      import('@integration-hub/features/swift-mt101').then(
        (module) => module.paymentValidationRulesRoutes
      ),
  },
  {
    id: 'executions',
    path: '/executions',
    titleKey: 'executions.title',
    requiredCapability: APP_SECTION_CAPABILITIES.executions,
    loadChildren: () =>
      Promise.all([
        import('@integration-hub/features/executions'),
        import('@integration-hub/features/swift-mt101/vocabulary'),
      ]).then(([executions, vocabulario]) =>
        conVocabulario(executions.executionCatalogRoutes, vocabulario.provideSwiftMt101I18n())
      ),
  },
  {
    id: 'schedules',
    path: '/schedules',
    titleKey: 'schedules.title',
    requiredCapability: APP_SECTION_CAPABILITIES.schedules,
    loadChildren: () =>
      import('@integration-hub/features/schedules').then(
        (module) => module.schedulesRoutes
      ),
  },
  {
    id: 'audit',
    path: '/audit',
    titleKey: 'audit.title',
    requiredCapability: APP_SECTION_CAPABILITIES.audit,
    loadChildren: () =>
      Promise.all([
        import('@integration-hub/features/audit'),
        import('@integration-hub/features/swift-mt101/vocabulary'),
      ]).then(([audit, vocabulario]) =>
        conVocabulario(audit.auditRoutes, vocabulario.provideSwiftMt101I18n())
      ),
  },
  {
    // ADR-019 Fase 2: pack SWIFT MT101 con namespace propio. Misma capability que auditoria por ahora
    // (la separacion RBAC swift-mt101-read queda para una fase posterior).
    id: 'swift-mt101',
    path: '/swift-mt101',
    titleKey: 'audit.domain.swiftMt101',
    requiredCapability: APP_SECTION_CAPABILITIES.audit,
    loadChildren: () =>
      import('@integration-hub/features/swift-mt101').then(
        (module) => module.swiftMt101Routes
      ),
  },
  {
    id: 'plugins',
    path: '/plugins',
    titleKey: 'plugins.title',
    requiredCapability: APP_SECTION_CAPABILITIES.plugins,
    loadComponent: () =>
      import('../features/plugins/plugin-diagnostics-page.component').then(
        (module) => module.PluginDiagnosticsPageComponent
      ),
  },
  {
    // Live catalog of the shared UI kit (author reference). Not in the nav; gated to admins.
    id: 'ui-kit',
    path: '/ui-kit',
    titleKey: 'uiKit.title',
    requiredCapability: APP_SECTION_CAPABILITIES.plugins,
    loadComponent: () =>
      import('../features/ui-kit/ui-kit-gallery.component').then(
        (module) => module.UiKitGalleryComponent
      ),
  },
];

export const PLATFORM_PLUGIN_MANIFEST: AppPluginManifest = {
  id: 'platform',
  version: '1.0.0',
  platformVersion: FRONTEND_EXTENSION_PLATFORM_VERSION,
  displayName: 'Integration Hub Platform',
  navigation: APP_NAVIGATION_DEFINITIONS,
  routes: PLATFORM_ROUTE_CONTRIBUTIONS,
  workspaces: [
    {
      id: 'audit-events',
      group: 'audit',
      domain: 'platform',
      domainLabelKey: 'audit.domain.platform',
      domainOrder: 10,
      route: '/audit/events',
      labelKey: 'audit.workspace.events',
      descriptionKey: 'audit.workspace.eventsHint',
      mode: 'query',
      requiredCapability: APP_SECTION_CAPABILITIES.audit,
    },
    {
      id: 'audit-record-lineage',
      group: 'audit',
      domain: 'platform',
      domainLabelKey: 'audit.domain.platform',
      domainOrder: 10,
      route: '/audit/record-lineage',
      labelKey: 'audit.workspace.lineage',
      descriptionKey: 'audit.workspace.lineageHint',
      mode: 'query',
      requiredCapability: APP_SECTION_CAPABILITIES.audit,
    },
    {
      id: 'audit-mt101-fragments',
      group: 'audit',
      domain: 'swift-mt101',
      domainLabelKey: 'audit.domain.swiftMt101',
      domainOrder: 20,
      route: '/swift-mt101/fragments',
      labelKey: 'audit.workspace.fragments',
      descriptionKey: 'audit.workspace.fragmentsHint',
      mode: 'query',
      requiredCapability: APP_SECTION_CAPABILITIES.audit,
    },
    {
      id: 'audit-spool',
      group: 'audit',
      domain: 'platform',
      domainLabelKey: 'audit.domain.platform',
      domainOrder: 10,
      route: '/audit/spool',
      labelKey: 'audit.workspace.spool',
      descriptionKey: 'audit.workspace.spoolHint',
      mode: 'operation',
      requiredCapability: APP_SECTION_CAPABILITIES.audit,
    },
    {
      id: 'audit-mt101-quarantine',
      group: 'audit',
      domain: 'swift-mt101',
      domainLabelKey: 'audit.domain.swiftMt101',
      domainOrder: 20,
      route: '/swift-mt101/quarantine',
      labelKey: 'audit.workspace.quarantine',
      descriptionKey: 'audit.workspace.quarantineHint',
      mode: 'operation',
      requiredCapability: APP_SECTION_CAPABILITIES.audit,
    },
    {
      id: 'audit-mt101-pay-dispatch',
      group: 'audit',
      domain: 'swift-mt101',
      domainLabelKey: 'audit.domain.swiftMt101',
      domainOrder: 20,
      route: '/swift-mt101/pay-dispatch',
      labelKey: 'audit.workspace.payDispatch',
      descriptionKey: 'audit.workspace.payDispatchHint',
      mode: 'query',
      requiredCapability: APP_SECTION_CAPABILITIES.audit,
    },
    {
      id: 'audit-mt101-pay-conflicts',
      group: 'audit',
      domain: 'swift-mt101',
      domainLabelKey: 'audit.domain.swiftMt101',
      domainOrder: 20,
      route: '/swift-mt101/pay-conflicts',
      labelKey: 'audit.workspace.payConflicts',
      descriptionKey: 'audit.workspace.payConflictsHint',
      mode: 'operation',
      requiredCapability: APP_SECTION_CAPABILITIES.audit,
    },
  ],
  actions: [
    {
      id: 'connections-bulk-activate',
      group: 'connections',
      placement: 'toolbar',
      labelKey: 'connections.activateSelected',
      command: 'connections.bulk.activate',
      icon: 'toggle-on',
      requiredCapability: APP_SECTION_CAPABILITIES.connections,
      confirmation: {
        labelKey: 'connections.bulk.confirmActivate',
        severity: 'warning',
      },
    },
    {
      id: 'connections-bulk-deactivate',
      group: 'connections',
      placement: 'toolbar',
      labelKey: 'connections.deactivateSelected',
      command: 'connections.bulk.deactivate',
      icon: 'toggle-off',
      requiredCapability: APP_SECTION_CAPABILITIES.connections,
      confirmation: {
        labelKey: 'connections.bulk.confirmDeactivate',
        severity: 'danger',
      },
    },
  ],
};
