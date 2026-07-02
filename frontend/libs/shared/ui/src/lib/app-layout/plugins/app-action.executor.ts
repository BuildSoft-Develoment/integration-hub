import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import {
  AppActionContribution,
  AppActionKind,
} from '../navigation/app-navigation.models';
import {
  APP_ACTION_COMMAND_HANDLERS,
  AppActionCommandHandler,
  AppActionExecutionContext,
} from './app-action.command';
import {
  APP_ACTION_CONFIRMATION_GATE,
  buildActionConfirmationRequest,
} from './app-action.confirmation';

@Injectable({ providedIn: 'root' })
export class AppActionExecutor {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly handlers = inject(APP_ACTION_COMMAND_HANDLERS, { optional: true }) ?? [];
  private readonly confirmationGate = inject(APP_ACTION_CONFIRMATION_GATE, { optional: true });

  canExecute(action: AppActionContribution, context: AppActionExecutionContext = {}): boolean {
    const kind = inferActionKind(action);

    if (kind === 'navigation') {
      return Boolean(action.route);
    }

    if (kind === 'external-link') {
      return Boolean(action.href?.startsWith('https://'));
    }

    const handler = this.findHandler(action.command ?? '');
    return Boolean(handler && (handler.canExecute?.(action, context) ?? true));
  }

  async execute(
    action: AppActionContribution,
    context: AppActionExecutionContext = {}
  ): Promise<boolean> {
    if (!(await this.confirmAction(action))) {
      return false;
    }

    const kind = inferActionKind(action);

    if (kind === 'navigation') {
      return this.navigate(action);
    }

    if (kind === 'external-link') {
      this.openExternalLink(action);
      return true;
    }

    await this.executeCommand(action, context);
    return true;
  }

  private async confirmAction(action: AppActionContribution): Promise<boolean> {
    const request = buildActionConfirmationRequest(action);
    if (!request) {
      return true;
    }

    if (!this.confirmationGate) {
      return false;
    }

    return (await this.confirmationGate.confirm(request)) === true;
  }

  private async navigate(action: AppActionContribution): Promise<boolean> {
    if (!action.route) {
      throw new Error(`Action "${action.id}" cannot navigate without route.`);
    }

    return this.router.navigateByUrl(action.route);
  }

  private openExternalLink(action: AppActionContribution): void {
    if (!action.href?.startsWith('https://')) {
      throw new Error(`Action "${action.id}" external href must start with "https://".`);
    }

    this.document.defaultView?.open(action.href, '_blank', 'noopener,noreferrer');
  }

  private async executeCommand(
    action: AppActionContribution,
    context: AppActionExecutionContext
  ): Promise<void> {
    const command = action.command ?? '';
    const handler = this.findHandler(command);

    if (!handler) {
      throw new Error(`No handler registered for action command "${command}".`);
    }

    if (handler.canExecute?.(action, context) === false) {
      throw new Error(`Action command "${command}" cannot be executed in the current context.`);
    }

    await handler.execute(action, context);
  }

  private findHandler(command: string): AppActionCommandHandler | undefined {
    const handlers = this.handlers.filter((handler) => handler.command === command);

    if (handlers.length > 1) {
      const sources = handlers.map((handler) => handler.source ?? 'unknown').join(', ');
      throw new Error(`Duplicate handlers registered for action command "${command}": ${sources}.`);
    }

    return handlers[0];
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
