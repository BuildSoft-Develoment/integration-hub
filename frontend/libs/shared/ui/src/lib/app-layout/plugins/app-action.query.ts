import { inject, Injectable } from '@angular/core';
import { AuthAccessService } from '@integration-hub/core/services';

import {
  AppActionContribution,
  AppActionKind,
  AppActionPlacement,
} from '../navigation/app-navigation.models';
import { ActionBarAction } from '../../floating-action-bar/floating-action-bar.component';
import { AppActionExecutionContext } from './app-action.command';
import { AppActionExecutor } from './app-action.executor';
import { AppPluginRuntimeRegistry } from './app-plugin-runtime.registry';

export interface AppActionQuery {
  readonly placement?: AppActionPlacement;
  readonly group?: string;
  readonly source?: string;
  readonly kind?: AppActionKind;
  readonly includeDisabled?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AppActionQueryService {
  private readonly access = inject(AuthAccessService);
  private readonly executor = inject(AppActionExecutor);
  private readonly plugins = inject(AppPluginRuntimeRegistry);

  visibleActions(
    query: AppActionQuery = {},
    context: AppActionExecutionContext = {}
  ): readonly AppActionContribution[] {
    return this.plugins.actions()
      .filter((action) => matchesQuery(action, query))
      .filter((action) => hasCapability(this.access, action))
      .filter((action) => query.includeDisabled || this.executor.canExecute(action, context));
  }

  actionBarActions(
    query: AppActionQuery = {},
    context: AppActionExecutionContext = {}
  ): readonly ActionBarAction[] {
    return this.visibleActions(query, context).map((action) => ({
      id: action.id,
      labelKey: action.labelKey,
      icon: action.icon ?? defaultIcon(action),
      danger: action.confirmation?.severity === 'danger',
      requiresConfirmation: action.confirmation != null,
      confirmationLabelKey: action.confirmation?.labelKey,
    }));
  }
}

function matchesQuery(action: AppActionContribution, query: AppActionQuery): boolean {
  if (query.placement && action.placement !== query.placement) {
    return false;
  }

  if (query.group && action.group !== query.group) {
    return false;
  }

  if (query.source && action.source !== query.source) {
    return false;
  }

  return !query.kind || inferActionKind(action) === query.kind;
}

function hasCapability(
  access: AuthAccessService,
  action: AppActionContribution
): boolean {
  return action.requiredCapability == null || access.hasCapability(action.requiredCapability);
}

function defaultIcon(action: AppActionContribution): string {
  switch (inferActionKind(action)) {
    case 'navigation':
      return 'arrow-right';
    case 'external-link':
      return 'external-link';
    case 'command':
      return action.confirmation?.severity === 'danger' ? 'triangle-alert' : 'play';
  }
}

function inferActionKind(action: AppActionContribution): AppActionKind {
  if (action.kind) {
    return action.kind;
  }

  if (action.route) {
    return 'navigation';
  }

  if (action.href) {
    return 'external-link';
  }

  return 'command';
}
