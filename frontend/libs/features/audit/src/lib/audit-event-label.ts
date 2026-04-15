import { I18nService } from '@integration-hub/core/services';

export function auditEventLabel(i18n: I18nService, eventType: string | null): string {
  if (!eventType) {
    return '-';
  }

  const key = `audit.eventLabel.${eventType}`;
  const translated = i18n.t(key);
  return translated !== key ? translated : eventType;
}
