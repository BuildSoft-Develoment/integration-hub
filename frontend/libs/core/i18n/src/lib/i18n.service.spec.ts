import { TestBed } from '@angular/core/testing';

import { I18nService } from './i18n.service';

describe('I18nService plugin message materialization', () => {
  function service(): I18nService {
    TestBed.configureTestingModule({});
    return TestBed.inject(I18nService);
  }

  it('resolves plugin messages registered for the active locale', () => {
    const i18n = service();
    i18n.setLocale('en');
    i18n.registerMessages('en', { 'plugins.demo.title': 'Demo plugin' });

    expect(i18n.t('plugins.demo.title')).toBe('Demo plugin');
  });

  it('never lets a plugin override a base platform key', () => {
    const i18n = service();
    i18n.setLocale('en');

    const ignored = i18n.registerMessages('en', { 'nav.audit': 'Hijacked' });

    expect(ignored).toContain('nav.audit');
    expect(i18n.t('nav.audit')).toBe('Audit');
  });

  it('keeps plugin messages scoped to their locale', () => {
    const i18n = service();
    i18n.registerMessages('en', { 'plugins.demo.scoped': 'EN only' });

    i18n.setLocale('es');
    expect(i18n.t('plugins.demo.scoped')).toBe('plugins.demo.scoped');

    i18n.setLocale('en');
    expect(i18n.t('plugins.demo.scoped')).toBe('EN only');
  });

  it('still interpolates variables in plugin messages', () => {
    const i18n = service();
    i18n.setLocale('en');
    i18n.registerMessages('en', { 'plugins.demo.count': '{count} items' });

    expect(i18n.t('plugins.demo.count', { count: 3 })).toBe('3 items');
  });

  it('returns the key unchanged when no translation exists', () => {
    const i18n = service();
    expect(i18n.t('plugins.unknown.key')).toBe('plugins.unknown.key');
  });
});
