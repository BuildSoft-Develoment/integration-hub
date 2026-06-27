import { TestBed } from '@angular/core/testing';
import { I18nService } from '@integration-hub/core/services';

import { PLATFORM_PLUGIN_MANIFEST } from './platform-plugin.manifest';

describe('PLATFORM_PLUGIN_MANIFEST i18n coverage', () => {
  function collectKeys(): string[] {
    const manifest = PLATFORM_PLUGIN_MANIFEST;
    const keys = [
      ...(manifest.navigation ?? []).map((item) => item.labelKey),
      ...(manifest.routes ?? []).map((route) => route.titleKey),
      ...(manifest.workspaces ?? []).flatMap((workspace) => [
        workspace.labelKey,
        workspace.descriptionKey,
      ]),
      ...(manifest.actions ?? []).flatMap((action) => [
        action.labelKey,
        action.confirmation?.labelKey,
      ]),
    ];

    return [...new Set(keys.filter((key): key is string => Boolean(key)))];
  }

  it.each(['en', 'es'] as const)('resolves every manifest key in %s', (locale) => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLocale(locale);

    const unresolved = collectKeys().filter((key) => i18n.t(key) === key);

    expect(unresolved).toEqual([]);
  });
});
