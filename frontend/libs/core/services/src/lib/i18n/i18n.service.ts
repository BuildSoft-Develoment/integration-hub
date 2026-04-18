import { computed, Injectable, signal } from '@angular/core';
import { en } from './dictionaries/en';
import { es } from './dictionaries/es';

type Locale = 'es' | 'en';

type Dictionary = Record<string, string>;

const dictionaries: Record<Locale, Dictionary> = {
  es,
  en,
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly locale = signal<Locale>('es');
  readonly dictionary = computed(() => dictionaries[this.locale()]);

  setLocale(locale: Locale): void {
    this.locale.set(locale);
  }

  t(key: string, vars: Record<string, string | number> = {}): string {
    const template = this.dictionary()[key] ?? key;
    return Object.entries(vars).reduce(
      (result, [token, value]) => result.split(`{${token}}`).join(String(value)),
      template,
    );
  }
}
