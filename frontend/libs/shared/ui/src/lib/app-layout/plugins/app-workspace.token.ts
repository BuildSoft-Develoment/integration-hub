import { InjectionToken, Provider } from '@angular/core';

import { AppWorkspaceContribution } from '../navigation/app-navigation.models';

export const APP_WORKSPACE_CONTRIBUTIONS = new InjectionToken<readonly AppWorkspaceContribution[]>(
  'APP_WORKSPACE_CONTRIBUTIONS'
);

export function provideAppWorkspaceContributions(
  workspaces: readonly AppWorkspaceContribution[],
  source = 'app'
): Provider[] {
  return workspaces.map((workspace, index) => ({
    provide: APP_WORKSPACE_CONTRIBUTIONS,
    multi: true,
    useValue: {
      ...workspace,
      source: workspace.source ?? source,
      order: workspace.order ?? index * 100,
    } satisfies AppWorkspaceContribution,
  }));
}
