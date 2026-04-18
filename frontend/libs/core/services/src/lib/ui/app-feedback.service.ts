import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { I18nService } from '../i18n/i18n.service';
import { UiMessageService } from './ui-message.service';

@Injectable({ providedIn: 'root' })
export class AppFeedbackService {
  private readonly i18n = inject(I18nService);
  private readonly uiMessage = inject(UiMessageService);

  created(entityKey: string): void {
    this.success('feedback.created', entityKey);
  }

  updated(entityKey: string): void {
    this.success('feedback.updated', entityKey);
  }

  activated(entityKey: string): void {
    this.success('feedback.activated', entityKey);
  }

  deactivated(entityKey: string): void {
    this.success('feedback.deactivated', entityKey);
  }

  deleted(entityKey: string): void {
    this.success('feedback.deleted', entityKey);
  }

  tested(entityKey: string): void {
    this.success('feedback.tested', entityKey);
  }

  testSuccess(entityKey: string): void {
    this.tested(entityKey);
  }

  testError(message: string): void {
    this.errorMessage(message);
  }

  info(messageKey: string, vars?: Record<string, string | number>): void {
    this.uiMessage.show({ kind: 'info', messageKey, vars });
  }

  error(messageKey: string, vars?: Record<string, string | number>): void {
    this.uiMessage.show({ kind: 'error', messageKey, vars });
  }

  errorMessage(message: string): void {
    this.uiMessage.show({ kind: 'error', message });
  }

  handleHttpError(error: HttpErrorResponse): void {
    const backendMessage = this.extractBackendMessage(error);
    if (backendMessage) {
      this.errorMessage(backendMessage);
      return;
    }

    const statusKey = `feedback.http.${error.status}`;
    const fallbackKey =
      error.status === 0 ? 'feedback.http.network' : 'feedback.http.default';

    this.uiMessage.show({
      kind: 'error',
      messageKey: this.i18n.t(statusKey) === statusKey ? fallbackKey : statusKey,
    });
  }

  private success(messageKey: string, entityKey: string): void {
    this.uiMessage.show({
      kind: 'success',
      messageKey,
      vars: { entity: this.i18n.t(entityKey) },
    });
  }

  private extractBackendMessage(error: HttpErrorResponse): string | null {
    const payload = error.error as Record<string, unknown> | string | null;
    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }
    if (payload && typeof payload === 'object') {
      const details = payload['details'];
      const message = payload['message'];
      if (typeof details === 'string' && details.trim()) {
        return details;
      }
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    return null;
  }
}
