import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthService } from '@integration-hub/core/services';

import { AppNavigationComponent } from './navigation/app-navigation.component';
import { AppPreferencesFacade } from './preferences/app-preferences.facade';
import { AppSessionActionComponent } from './session-action/app-session-action.component';
import { AppThemeActionComponent } from './theme-action/app-theme-action.component';

@Component({
  selector: 'ih-app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatProgressBarModule,
    MatSidenavModule,
    AppNavigationComponent,
    AppSessionActionComponent,
    AppThemeActionComponent,
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css',
})
export class AppLayoutComponent {
  readonly auth = inject(AuthService);
  readonly preferences = inject(AppPreferencesFacade);
  readonly i18n = this.preferences.i18n;
  readonly theme = this.preferences.theme;

  readonly desktopMode = signal(this.resolveDesktopMode());
  readonly mobileNavOpen = signal(false);

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

  private resolveDesktopMode(): boolean {
    return typeof window === 'undefined' ? true : window.innerWidth >= 1180;
  }
}

