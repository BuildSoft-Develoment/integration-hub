import { I18nService } from '@integration-hub/core/services';

export function taskTypeLabel(i18n: I18nService, taskType: string | null): string {
  if (!taskType) {
    return '-';
  }

  const key = `taskTypeLabel.${taskType}`;
  const translated = i18n.t(key);
  return translated !== key ? translated : taskType;
}
