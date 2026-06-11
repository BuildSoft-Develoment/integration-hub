import { AuthCapability } from '@integration-hub/core/services';

export type AppSectionKey =
  | 'overview'
  | 'sources'
  | 'connections'
  | 'readers'
  | 'processes'
  | 'paymentRules'
  | 'executions'
  | 'schedules'
  | 'audit';

export type AppSectionCapability = AuthCapability | null;

export const APP_SECTION_CAPABILITIES: Record<
  AppSectionKey,
  AppSectionCapability
> = {
  overview: null,
  sources: 'admin',
  connections: 'admin',
  readers: 'admin',
  processes: 'admin',
  paymentRules: 'admin',
  executions: 'operate',
  schedules: 'audit',
  audit: 'audit',
};
