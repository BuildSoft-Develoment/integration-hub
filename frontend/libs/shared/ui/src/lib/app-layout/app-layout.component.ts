import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthService, BreadcrumbService } from '@integration-hub/core/services';

import { AppNavigationComponent } from './navigation/app-navigation.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { AppPreferencesFacade } from './preferences/app-preferences.facade';
import { AppSessionActionComponent } from './session-action/app-session-action.component';
import { AppThemeActionComponent } from './theme-action/app-theme-action.component';
import { KeyboardShortcutsService } from '../actions/keyboard-shortcuts.service';

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
    BreadcrumbComponent,
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css',
})
export class AppLayoutComponent implements OnDestroy {
  readonly auth = inject(AuthService);
  readonly breadcrumb = inject(BreadcrumbService);
  readonly preferences = inject(AppPreferencesFacade);
  readonly i18n = this.preferences.i18n;
  readonly theme = this.preferences.theme;
  private readonly shortcuts = inject(KeyboardShortcutsService);

  readonly desktopMode = signal(this.resolveDesktopMode());
  readonly mobileNavOpen = signal(false);
  /** Colapso on-demand del nav en desktop (estado efimero de UI, no se persiste). */
  readonly desktopNavCollapsed = signal(false);
  private unregisterShortcuts: (() => void) | null = null;

  /**
   * Ancho actual del nav lateral, publicado como `--ih-shell-sidebar-width` en el arbol de
   * contenido para que los overlays viewport-fixed (barra de acciones, overlays de processes)
   * se alineen con el contenido en vez de quedar detras del nav. `0px` cuando el nav esta
   * colapsado (desktop) o se superpone (mobile), casos en que el contenido ocupa todo el ancho.
   */
  readonly sidebarWidthPx = computed(() =>
    !this.desktopMode() || this.desktopNavCollapsed() ? '0px' : '308px'
  );

  constructor() {
    this.unregisterShortcuts = this.shortcuts.register([
      {
        key: '/',
        description: this.i18n.t('shell.shortcutSearch'),
        handler: () => this.focusSearch(),
      },
      {
        key: 'Escape',
        description: this.i18n.t('shell.shortcutClose'),
        handler: () => this.closeNavigation(),
        preventDefault: false,
      },
      {
        key: 'c',
        description: this.i18n.t('common.create'),
        handler: () => this.clickFirstCreateButton(),
      },
      {
        key: 'r',
        description: this.i18n.t('common.refresh'),
        handler: () => this.clickFirstRefreshButton(),
      },
    ]);
  }

  ngOnDestroy(): void {
    this.unregisterShortcuts?.();
    this.unregisterShortcuts = null;
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
    if (this.desktopMode()) {
      this.desktopNavCollapsed.update((collapsed) => !collapsed);
    } else {
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

  private focusSearch(): void {
    const searchInput = document.querySelector<HTMLInputElement>('.toolbar-search input, .ih-catalog-toolbar input[type="text"]');
    searchInput?.focus();
  }

  private clickFirstCreateButton(): void {
    document.querySelector<HTMLButtonElement>('.create-button')?.click();
  }

  private clickFirstRefreshButton(): void {
    const label = this.i18n.t('common.refresh');
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button.ih-catalog-action'));
    const refreshBtn = buttons.find((b) => b.textContent?.trim().includes(label));
    refreshBtn?.click();
  }
}

