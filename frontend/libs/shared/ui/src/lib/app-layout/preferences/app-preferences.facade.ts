// @trace RF-002 (tema: actualizar preset/locale/colores desde la UI de preferencias)
import { Injectable, inject, signal } from '@angular/core';
import {
  I18nService,
  SystemThemeConfigService,
  ThemeConfiguration,
  ThemeMode,
  ThemePreset,
  ThemeService,
} from '@integration-hub/core/services';

@Injectable({ providedIn: 'root' })
export class AppPreferencesFacade {
  readonly i18n = inject(I18nService);
  readonly theme = inject(ThemeService);
  private readonly systemThemeConfig = inject(SystemThemeConfigService);

  readonly saving = signal(false);

  constructor() {
    this.systemThemeConfig.get().subscribe({
      next: (configuration) => this.applyConfiguration(configuration),
      // Degradar silencioso: si no se puede leer el tema (403 por rol, o red), se conserva el
      // default local sin propagar un error no manejado a la consola en cada carga.
      error: () => undefined,
    });
  }

  updateMode(mode: ThemeMode): void {
    this.theme.setMode(mode);
    this.persistConfiguration();
  }

  updatePreset(preset: ThemePreset): void {
    this.theme.setPreset(preset);
    this.persistConfiguration();
  }

  updateLocale(locale: 'es' | 'en'): void {
    this.i18n.setLocale(locale);
    this.persistConfiguration();
  }

  updateCustomColor(key: 'primary' | 'error' | 'neutral', value: string): void {
    this.theme.setCustomPalette({ [key]: value });
    this.persistConfiguration();
  }

  /** Actualiza el branding (nombre/marca/logo) y lo persiste. `logoDataUri: ''` limpia el logo. */
  updateBranding(patch: Partial<Pick<ThemeConfiguration, 'brandName' | 'brandMark' | 'logoDataUri'>>): void {
    this.theme.setBranding(patch);
    this.persistConfiguration();
  }

  private persistConfiguration(): void {
    this.saving.set(true);
    const configuration: ThemeConfiguration = {
      ...this.theme.configuration(),
      locale: this.i18n.locale(),
    };

    this.systemThemeConfig.update(configuration).subscribe({
      next: (savedConfiguration) => {
        this.applyConfiguration(savedConfiguration);
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  private applyConfiguration(configuration: ThemeConfiguration): void {
    this.theme.applyConfiguration(configuration);
    this.i18n.setLocale(configuration.locale);
  }
}
