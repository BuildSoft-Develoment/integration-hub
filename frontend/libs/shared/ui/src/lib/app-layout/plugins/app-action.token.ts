import { InjectionToken, Provider } from '@angular/core';

import { AppActionContribution } from '../navigation/app-navigation.models';

export const APP_ACTION_CONTRIBUTIONS = new InjectionToken<readonly AppActionContribution[]>(
  'APP_ACTION_CONTRIBUTIONS'
);

export function provideAppActionContributions(
  actions: readonly AppActionContribution[],
  source = 'app'
): Provider[] {
  return actions.map((action, index) => ({
    provide: APP_ACTION_CONTRIBUTIONS,
    multi: true,
    useValue: {
      ...action,
      source: action.source ?? source,
      order: action.order ?? index * 100,
    } satisfies AppActionContribution,
  }));
}
