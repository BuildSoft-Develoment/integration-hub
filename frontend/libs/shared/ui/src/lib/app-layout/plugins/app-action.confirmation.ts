import { DOCUMENT } from '@angular/common';
import { inject, Injectable, InjectionToken, Provider } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';

import { AppActionContribution } from '../navigation/app-navigation.models';

export type AppActionConfirmationSeverity = 'danger' | 'warning';

export interface AppActionConfirmationRequest {
  readonly actionId: string;
  readonly severity: AppActionConfirmationSeverity;
  readonly labelKey?: string;
  readonly message?: string;
}

/**
 * Interactive gate consulted by {@link AppActionExecutor} before running an
 * action that declares {@link AppActionContribution.confirmation}. Returning
 * `false` aborts the action without any side effect.
 */
export interface AppActionConfirmationGate {
  confirm(request: AppActionConfirmationRequest): boolean | Promise<boolean>;
}

export const APP_ACTION_CONFIRMATION_GATE =
  new InjectionToken<AppActionConfirmationGate>('APP_ACTION_CONFIRMATION_GATE');

/**
 * Builds a confirmation request from an action contribution, or `null` when the
 * action does not require confirmation. The severity defaults to `warning` so a
 * declared-but-empty confirmation is still treated as governed.
 */
export function buildActionConfirmationRequest(
  action: AppActionContribution
): AppActionConfirmationRequest | null {
  if (!action.confirmation) {
    return null;
  }

  return {
    actionId: action.id,
    severity: action.confirmation.severity ?? 'warning',
    labelKey: action.confirmation.labelKey,
  };
}

/**
 * Default gate backed by the host window `confirm` dialog. Resolves the
 * `labelKey` through {@link I18nService} when available, falling back to the raw
 * key. When no browsing context exists the gate denies execution (fail-safe).
 */
@Injectable({ providedIn: 'root' })
export class WindowActionConfirmationGate implements AppActionConfirmationGate {
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(I18nService, { optional: true });

  confirm(request: AppActionConfirmationRequest): boolean {
    const view = this.document.defaultView;
    if (!view?.confirm) {
      return false;
    }

    return view.confirm(this.resolvePrompt(request));
  }

  private resolvePrompt(request: AppActionConfirmationRequest): string {
    if (request.message?.trim()) {
      return request.message.trim();
    }

    if (request.labelKey) {
      const resolved = this.i18n?.t(request.labelKey);
      if (resolved && resolved !== request.labelKey) {
        return resolved;
      }
      return request.labelKey;
    }

    return `Confirm action "${request.actionId}".`;
  }
}

/**
 * Wires a confirmation gate into the action execution pipeline. Without this
 * provider, actions that declare a confirmation are denied execution by the
 * executor (fail-safe). Pass a custom gate to integrate a richer dialog.
 */
export function provideAppActionConfirmationGate(
  gate?: AppActionConfirmationGate
): Provider {
  return gate
    ? { provide: APP_ACTION_CONFIRMATION_GATE, useValue: gate }
    : {
        provide: APP_ACTION_CONFIRMATION_GATE,
        useExisting: WindowActionConfirmationGate,
      };
}
