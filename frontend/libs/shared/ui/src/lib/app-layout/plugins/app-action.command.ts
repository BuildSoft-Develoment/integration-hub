import { InjectionToken, Provider } from '@angular/core';

import { AppActionContribution } from '../navigation/app-navigation.models';

export interface AppActionExecutionContext {
  readonly source?: string;
  readonly selection?: readonly string[];
  readonly payload?: unknown;
}

export interface AppActionCommandHandler {
  readonly command: string;
  readonly source?: string;
  readonly canExecute?: (
    action: AppActionContribution,
    context: AppActionExecutionContext
  ) => boolean;
  readonly execute: (
    action: AppActionContribution,
    context: AppActionExecutionContext
  ) => void | Promise<void>;
}

export const APP_ACTION_COMMAND_HANDLERS = new InjectionToken<readonly AppActionCommandHandler[]>(
  'APP_ACTION_COMMAND_HANDLERS'
);

export function provideAppActionCommandHandlers(
  handlers: readonly AppActionCommandHandler[],
  source = 'app'
): Provider[] {
  return handlers.map((handler) => ({
    provide: APP_ACTION_COMMAND_HANDLERS,
    multi: true,
    useValue: {
      ...handler,
      source: handler.source ?? source,
    } satisfies AppActionCommandHandler,
  }));
}
