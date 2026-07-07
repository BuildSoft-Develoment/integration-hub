import { computed, Injectable, signal } from '@angular/core';
import { en } from './dictionaries/en';
import { es } from './dictionaries/es';

type Locale = 'es' | 'en';

type Dictionary = Record<string, string>;

const baseDictionaries: Record<Locale, Dictionary> = {
  es,
  en,
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly locale = signal<Locale>('es');
  private readonly overlay = signal<Record<Locale, Dictionary>>({ es: {}, en: {} });

  readonly dictionary = computed<Dictionary>(() => ({
    ...this.overlay()[this.locale()],
    ...baseDictionaries[this.locale()],
  }));

  setLocale(locale: Locale): void {
    this.locale.set(locale);
  }

  /**
   * Materializes plugin-provided translations for a locale. Base platform keys
   * always win, so a plugin can never shadow a core key; only keys not already
   * defined by the platform are added to the overlay. Returns the keys that were
   * ignored because they collided with the platform dictionary.
   */
  registerMessages(locale: Locale, messages: Dictionary): readonly string[] {
    const base = baseDictionaries[locale];
    const ignored: string[] = [];
    const additions: Dictionary = {};

    for (const [key, value] of Object.entries(messages)) {
      if (key in base) {
        ignored.push(key);
        continue;
      }
      additions[key] = value;
    }

    this.overlay.update((current) => ({
      ...current,
      [locale]: { ...current[locale], ...additions },
    }));

    return ignored;
  }

  t(key: string, vars: Record<string, string | number> = {}): string {
    const template = this.dictionary()[key] ?? key;
    return Object.entries(vars).reduce(
      (result, [token, value]) => result.split(`{${token}}`).join(String(value)),
      template,
    );
  }
}
