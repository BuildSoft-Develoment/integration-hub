import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import {
  SidebarMode,
  ThemeDensity,
  ThemeMode,
  ThemePreset,
} from '@integration-hub/core/services';

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

  readonly densityOptions: readonly ThemeOption<ThemeDensity>[] = [
    { value: 'comfortable', labelKey: 'shell.density.comfortable' },
    { value: 'compact', labelKey: 'shell.density.compact' },
  ];

  readonly localeOptions: readonly ThemeOption<'es' | 'en'>[] = [
    { value: 'es', labelKey: 'ES' },
    { value: 'en', labelKey: 'EN' },
  ];

  readonly sidebarOptions: readonly ThemeOption<SidebarMode>[] = [
    { value: 'expanded', labelKey: 'shell.sidebar.expanded' },
    { value: 'compact', labelKey: 'shell.sidebar.compact' },
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

  currentSidebarLabel(): string {
    return this.i18n.t(
      this.theme.sidebarMode() === 'compact'
        ? 'shell.sidebar.compact'
        : 'shell.sidebar.expanded'
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
}
