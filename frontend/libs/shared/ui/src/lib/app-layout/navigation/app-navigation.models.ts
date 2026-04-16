import { AuthCapability } from '@integration-hub/core/services';

export interface AppNavigationItem {
  readonly id: string;
  readonly route: string;
  readonly labelKey: string;
  readonly requiredCapability?: AuthCapability | null;
}
