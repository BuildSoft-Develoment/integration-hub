import { APP_NAVIGATION_ITEMS } from '@integration-hub/shared/ui';

import { APP_NAVIGATION_DEFINITIONS } from './app-navigation.policy';

export const appNavigationProvider = {
  provide: APP_NAVIGATION_ITEMS,
  useValue: APP_NAVIGATION_DEFINITIONS,
};
