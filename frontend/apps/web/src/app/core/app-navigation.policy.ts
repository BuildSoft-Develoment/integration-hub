import { AppNavigationItem } from '@integration-hub/shared/ui';

import { APP_SECTION_CAPABILITIES } from './app-section-access.policy';

export const APP_NAVIGATION_DEFINITIONS: readonly AppNavigationItem[] = [
  {
    id: 'overview',
    route: '/overview',
    labelKey: 'nav.overview',
    requiredCapability: APP_SECTION_CAPABILITIES.overview,
  },
  {
    id: 'sources',
    route: '/sources',
    labelKey: 'nav.sources',
    requiredCapability: APP_SECTION_CAPABILITIES.sources,
  },
  {
    id: 'connections',
    route: '/connections',
    labelKey: 'nav.connections',
    requiredCapability: APP_SECTION_CAPABILITIES.connections,
  },
  {
    id: 'readers',
    route: '/readers',
    labelKey: 'nav.readers',
    requiredCapability: APP_SECTION_CAPABILITIES.readers,
  },
  {
    id: 'processes',
    route: '/processes',
    labelKey: 'nav.processes',
    requiredCapability: APP_SECTION_CAPABILITIES.processes,
  },
  {
    id: 'paymentRules',
    route: '/payment-rules',
    labelKey: 'nav.paymentRules',
    requiredCapability: APP_SECTION_CAPABILITIES.paymentRules,
  },
  {
    id: 'executions',
    route: '/executions',
    labelKey: 'nav.executions',
    requiredCapability: APP_SECTION_CAPABILITIES.executions,
  },
  {
    // Consola de operaciones DLQ async (sub-ruta de executions), expuesta en el nav como las
    // sub-consolas de auditoría (spool/cuarentena). Misma capability que la sección executions.
    id: 'asyncDlq',
    route: '/executions/async-dlq',
    labelKey: 'nav.asyncDlq',
    requiredCapability: APP_SECTION_CAPABILITIES.executions,
  },
  {
    id: 'schedules',
    route: '/schedules',
    labelKey: 'nav.schedules',
    requiredCapability: APP_SECTION_CAPABILITIES.schedules,
  },
  {
    // Entrada unica de auditoria (ADR-019): el hub /audit agrupa sus sub-auditorias por dominio
    // (generico vs SWIFT MT101) via el workspace-nav; ya no se listan planas en el sidebar.
    id: 'audit',
    route: '/audit',
    labelKey: 'nav.audit',
    requiredCapability: APP_SECTION_CAPABILITIES.audit,
  },
  {
    id: 'plugins',
    route: '/plugins',
    labelKey: 'nav.plugins',
    requiredCapability: APP_SECTION_CAPABILITIES.plugins,
  },
];
