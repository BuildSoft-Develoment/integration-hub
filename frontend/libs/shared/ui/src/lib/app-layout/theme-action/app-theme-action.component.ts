import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeMode, ThemePreset } from '@integration-hub/core/services';

import { AppPreferencesFacade } from '../preferences/app-preferences.facade';

interface ThemeOption<TValue> {
  readonly value: TValue;
  readonly labelKey: string;
}

@Component({
  selector: 'ih-app-theme-action',
  standalone: true,
  imports: [MatButtonModule, MatMenuModule],
  templateUrl: './app-theme-action.component.html',
  styleUrl: './app-theme-action.component.css',
})
export class AppThemeActionComponent {
  readonly preferences = inject(AppPreferencesFacade);
  readonly i18n = this.preferences.i18n;
  readonly theme = this.preferences.theme;

  readonly modeOptions: readonly ThemeOption<ThemeMode>[] = [
    { value: 'light', labelKey: 'shell.mode.light' },
    { value: 'dark', labelKey: 'shell.mode.dark' },
    { value: 'system', labelKey: 'shell.mode.system' },
  ];

  readonly presetOptions: readonly ThemeOption<Exclude<ThemePreset, 'custom'>>[] = [
    { value: 'horizon', labelKey: 'shell.preset.horizon' },
    { value: 'atlas', labelKey: 'shell.preset.atlas' },
  ];

  readonly localeOptions: readonly ThemeOption<'es' | 'en'>[] = [
    { value: 'es', labelKey: 'ES' },
    { value: 'en', labelKey: 'EN' },
  ];

  readonly customColorFields: readonly ThemeOption<'primary' | 'error' | 'neutral'>[] = [
    { value: 'primary', labelKey: 'shell.color.primary' },
    { value: 'error', labelKey: 'shell.color.error' },
    { value: 'neutral', labelKey: 'shell.color.neutral' },
  ];

  currentModeLabel(): string {
    const mode = this.theme.mode();
    return this.i18n.t(
      mode === 'system'
        ? 'shell.mode.system'
        : mode === 'dark'
          ? 'shell.mode.dark'
          : 'shell.mode.light'
    );
  }

  colorValue(key: 'primary' | 'error' | 'neutral'): string {
    switch (key) {
      case 'primary':
        return this.theme.primary();
      case 'error':
        return this.theme.error();
      default:
        return this.theme.neutral();
    }
  }

  setCustomPreset(): void {
    this.preferences.updatePreset('custom');
  }

  // --- White-label: nombre, marca y logo ---
  private static readonly MAX_LOGO_BYTES = 256 * 1024;
  private static readonly LOGO_TYPES = /^image\/(svg\+xml|png|jpeg|webp|gif)$/;

  readonly logoError = signal<string | null>(null);

  onBrandName(value: string): void {
    this.preferences.updateBranding({ brandName: value });
  }

  onBrandMark(value: string): void {
    this.preferences.updateBranding({ brandMark: value });
  }

  clearLogo(): void {
    this.logoError.set(null);
    this.preferences.updateBranding({ logoDataUri: '' });
  }

  async onLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!AppThemeActionComponent.LOGO_TYPES.test(file.type)) {
      this.logoError.set(this.i18n.t('shell.brand.logoTypeError'));
      return;
    }
    if (file.size > AppThemeActionComponent.MAX_LOGO_BYTES) {
      this.logoError.set(this.i18n.t('shell.brand.logoSizeError'));
      return;
    }
    try {
      const dataUri = await this.readAsDataUri(file);
      this.logoError.set(null);
      this.preferences.updateBranding({ logoDataUri: dataUri });
    } catch {
      this.logoError.set(this.i18n.t('shell.brand.logoReadError'));
    }
  }

  private readAsDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
