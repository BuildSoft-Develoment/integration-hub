// @trace RF-002 (tema: actualizar preset/density/locale/sidebarMode desde la UI de preferencias)
import { Injectable, inject, signal } from '@angular/core';
import {
  I18nService,
  SidebarMode,
  SystemThemeConfigService,
  ThemeConfiguration,
  ThemeDensity,
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

  updateDensity(density: ThemeDensity): void {
    this.theme.setDensity(density);
    this.persistConfiguration();
  }

  updateLocale(locale: 'es' | 'en'): void {
    this.i18n.setLocale(locale);
    this.persistConfiguration();
  }

  updateSidebarMode(sidebarMode: SidebarMode): void {
    this.theme.setSidebarMode(sidebarMode);
    this.persistConfiguration();
  }

  updateCustomColor(key: 'primary' | 'error' | 'neutral', value: string): void {
    this.theme.setCustomPalette({ [key]: value });
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
