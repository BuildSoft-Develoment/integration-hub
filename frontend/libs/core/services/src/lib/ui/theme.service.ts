import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemePreset = 'horizon' | 'atlas' | 'custom';
export type ThemeDensity = 'comfortable' | 'compact';
export type SidebarMode = 'expanded' | 'compact';

export interface ThemeConfiguration {
  scheme: ThemeMode;
  preset: ThemePreset;
  density: ThemeDensity;
  locale: 'es' | 'en';
  sidebarMode: SidebarMode;
  primary: string;
  error: string;
  neutral: string;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly systemMode = signal<'light' | 'dark'>('light');
  private readonly presetPalette: Record<
    Exclude<ThemePreset, 'custom'>,
    Pick<ThemeConfiguration, 'primary' | 'error' | 'neutral'>
  > = {
    horizon: {
      primary: '#0F766E',
      error: '#E5484D',
      neutral: '#8B8D98',
    },
    atlas: {
      primary: '#D97706',
      error: '#E5484D',
      neutral: '#8B8D98',
    },
  };

  readonly mode = signal<ThemeMode>('light');
  readonly preset = signal<ThemePreset>('horizon');
  readonly density = signal<ThemeDensity>('comfortable');
  readonly sidebarMode = signal<SidebarMode>('expanded');
  readonly primary = signal('#0F766E');
  readonly error = signal('#E5484D');
  readonly neutral = signal('#8B8D98');

  constructor() {
    const mediaQuery = typeof window === 'undefined' ? null : window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQuery) {
      this.systemMode.set(mediaQuery.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', (event) => {
        this.systemMode.set(event.matches ? 'dark' : 'light');
      });
    }

    effect(() => {
      const root = this.document.documentElement;
      root.dataset['themeMode'] = this.mode() === 'system' ? this.systemMode() : this.mode();
      root.dataset['themePreset'] = this.preset();
      root.dataset['themeDensity'] = this.density();
      root.dataset['sidebarMode'] = this.sidebarMode();
      root.style.setProperty('--ih-theme-primary', this.primary());
      root.style.setProperty('--ih-theme-error', this.error());
      root.style.setProperty('--ih-theme-neutral', this.neutral());
      root.style.setProperty('--ih-error', this.error());
      root.style.setProperty('--ih-neutral', this.neutral());
      if (this.preset() === 'custom') {
        root.style.setProperty('--ih-accent', this.primary());
        root.style.setProperty('--ih-accent-strong', this.primary());
      } else {
        root.style.removeProperty('--ih-accent');
        root.style.removeProperty('--ih-accent-strong');
      }
    });
  }

  toggleMode(): void {
    this.mode.update((mode) => (mode === 'light' ? 'dark' : 'light'));
  }

  setPreset(preset: ThemePreset): void {
    this.preset.set(preset);
    if (preset !== 'custom') {
      const palette = this.presetPalette[preset];
      this.primary.set(palette.primary);
      this.error.set(palette.error);
      this.neutral.set(palette.neutral);
    }
  }

  setDensity(density: ThemeDensity): void {
    this.density.set(density);
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  setSidebarMode(sidebarMode: SidebarMode): void {
    this.sidebarMode.set(sidebarMode);
  }

  setCustomPalette(patch: Partial<Pick<ThemeConfiguration, 'primary' | 'error' | 'neutral'>>): void {
    this.preset.set('custom');
    if (patch.primary) {
      this.primary.set(patch.primary);
    }
    if (patch.error) {
      this.error.set(patch.error);
    }
    if (patch.neutral) {
      this.neutral.set(patch.neutral);
    }
  }

  applyConfiguration(configuration: ThemeConfiguration): void {
    this.mode.set(configuration.scheme);
    this.density.set(configuration.density);
    this.preset.set(configuration.preset);
    this.sidebarMode.set(configuration.sidebarMode);
    this.primary.set(configuration.primary);
    this.error.set(configuration.error);
    this.neutral.set(configuration.neutral);
  }

  configuration(): ThemeConfiguration {
    return {
      scheme: this.mode(),
      preset: this.preset(),
      density: this.density(),
      locale: 'es',
      sidebarMode: this.sidebarMode(),
      primary: this.primary(),
      error: this.error(),
      neutral: this.neutral(),
    };
  }
}
