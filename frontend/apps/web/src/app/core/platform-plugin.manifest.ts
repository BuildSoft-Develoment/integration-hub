import {
  AppPluginManifest,
  AppRouteContribution,
  FRONTEND_EXTENSION_PLATFORM_VERSION,
} from '@integration-hub/shared/ui';

import { APP_NAVIGATION_DEFINITIONS } from './app-navigation.policy';
import { APP_SECTION_CAPABILITIES } from './app-section-access.policy';

export const PLATFORM_ROUTE_CONTRIBUTIONS: readonly AppRouteContribution[] = [
  {
    id: 'overview',
    path: '/overview',
    titleKey: 'overview.title',
    requiredCapability: APP_SECTION_CAPABILITIES.overview,
    loadChildren: () =>
      import('@integration-hub/features/overview').then(
        (module) => module.overviewRoutes
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
    loadChildren: () =>
      import('@integration-hub/features/processes').then(
        (module) => module.processCatalogRoutes
      ),
  },
  {
    id: 'paymentRules',
    path: '/payment-rules',
    titleKey: 'paymentRules.title',
    requiredCapability: APP_SECTION_CAPABILITIES.paymentRules,
    loadChildren: () =>
      import('@integration-hub/features/payments').then(
        (module) => module.paymentValidationRulesRoutes
      ),
  },
  {
    id: 'executions',
    path: '/executions',
    titleKey: 'executions.title',
    requiredCapability: APP_SECTION_CAPABILITIES.executions,
    loadChildren: () =>
      import('@integration-hub/features/executions').then(
        (module) => module.executionCatalogRoutes
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
      import('@integration-hub/features/audit').then(
        (module) => module.auditRoutes
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
      route: '/audit',
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
      route: '/audit/mt101-fragments',
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
      route: '/audit/mt101-quarantine',
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
      route: '/audit/mt101-pay-dispatch',
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
      route: '/audit/mt101-pay-conflicts',
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
