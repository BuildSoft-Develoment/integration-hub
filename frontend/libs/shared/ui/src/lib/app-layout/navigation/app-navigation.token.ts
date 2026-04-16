import { InjectionToken } from '@angular/core';

import { AppNavigationItem } from './app-navigation.models';

export const DEFAULT_APP_NAVIGATION_ITEMS: readonly AppNavigationItem[] = [];

export const APP_NAVIGATION_ITEMS = new InjectionToken<readonly AppNavigationItem[]>(
  'APP_NAVIGATION_ITEMS',
  {
    providedIn: 'root',
    factory: () => DEFAULT_APP_NAVIGATION_ITEMS,
  }
);
