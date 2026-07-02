import { InjectionToken, Provider } from '@angular/core';

import { AppNavigationContribution, AppNavigationItem } from './app-navigation.models';

export const DEFAULT_APP_NAVIGATION_ITEMS: readonly AppNavigationItem[] = [];

export const APP_NAVIGATION_ITEMS = new InjectionToken<readonly AppNavigationItem[]>(
  'APP_NAVIGATION_ITEMS',
  {
    providedIn: 'root',
    factory: () => DEFAULT_APP_NAVIGATION_ITEMS,
  }
);

export const APP_NAVIGATION_CONTRIBUTIONS = new InjectionToken<readonly AppNavigationContribution[]>(
  'APP_NAVIGATION_CONTRIBUTIONS'
);

export function provideAppNavigationContributions(
  items: readonly AppNavigationContribution[],
  source = 'app'
): Provider[] {
  return items.map((item, index) => ({
    provide: APP_NAVIGATION_CONTRIBUTIONS,
    multi: true,
    useValue: {
      ...item,
      source: item.source ?? source,
      order: item.order ?? index * 100,
    } satisfies AppNavigationContribution,
  }));
}
