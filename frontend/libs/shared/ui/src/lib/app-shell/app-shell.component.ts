import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import {
  AuthService,
  I18nService,
  SystemThemeConfigService,
  ThemeService,
  ThemeConfiguration,
  ThemeDensity,
  ThemeMode,
  ThemePreset,
  SidebarMode,
} from '@integration-hub/core/services';

@Component({
  selector: 'ih-app-shell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatButtonModule,
    MatFormFieldModule,
    MatListModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSidenavModule,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {
  readonly i18n = inject(I18nService);
  readonly theme = inject(ThemeService);
  private readonly systemThemeConfig = inject(SystemThemeConfigService);
  readonly auth = inject(AuthService);

  readonly desktopMode = signal(this.resolveDesktopMode());
  readonly mobileNavOpen = signal(false);
  readonly themeSaving = signal(false);

  constructor() {
    this.systemThemeConfig.get().subscribe({
      next: (configuration) => {
        this.theme.applyConfiguration(configuration);
        this.i18n.setLocale(configuration.locale);
      },
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    const desktop = this.resolveDesktopMode();
    this.desktopMode.set(desktop);
    if (desktop) {
      this.mobileNavOpen.set(false);
    }
  }

  toggleNavigation(): void {
    if (!this.desktopMode()) {
      this.mobileNavOpen.update((value) => !value);
    }
  }

  closeNavigation(): void {
    if (!this.desktopMode()) {
      this.mobileNavOpen.set(false);
    }
  }

  updateMode(mode: ThemeMode): void {
    this.theme.setMode(mode);
    this.persistTheme();
  }

  updatePreset(preset: ThemePreset): void {
    this.theme.setPreset(preset);
    this.persistTheme();
  }

  updateDensity(density: ThemeDensity): void {
    this.theme.setDensity(density);
    this.persistTheme();
  }

  updateLocale(locale: 'es' | 'en'): void {
    this.i18n.setLocale(locale);
    this.persistTheme();
  }

  updateSidebarMode(sidebarMode: SidebarMode): void {
    this.theme.setSidebarMode(sidebarMode);
    this.persistTheme();
  }

  updateCustomColor(key: 'primary' | 'error' | 'neutral', value: string): void {
    this.theme.setCustomPalette({ [key]: value });
    this.persistTheme();
  }

  private resolveDesktopMode(): boolean {
    return typeof window === 'undefined' ? true : window.innerWidth >= 1180;
  }

  private persistTheme(): void {
    this.themeSaving.set(true);
    const configuration: ThemeConfiguration = {
      ...this.theme.configuration(),
      locale: this.i18n.locale(),
    };
    this.systemThemeConfig.update(configuration).subscribe({
      next: (configuration) => {
        this.theme.applyConfiguration(configuration);
        this.i18n.setLocale(configuration.locale);
        this.themeSaving.set(false);
      },
      error: () => {
        this.themeSaving.set(false);
      },
    });
  }
}

