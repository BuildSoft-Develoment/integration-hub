import { CommonModule } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthAccessService, I18nService } from '@integration-hub/core/services';

import { AppPluginRuntimeRegistry } from '../plugins/app-plugin-runtime.registry';

@Component({
  selector: 'ih-app-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatListModule],
  templateUrl: './app-navigation.component.html',
  styleUrl: './app-navigation.component.css',
})
export class AppNavigationComponent {
  readonly i18n = inject(I18nService);
  readonly access = inject(AuthAccessService);
  private readonly plugins = inject(AppPluginRuntimeRegistry);
  private readonly router = inject(Router);
  readonly items = computed(() =>
    this.plugins.navigation().filter(
      (item) =>
        item.requiredCapability == null ||
        this.access.hasCapability(item.requiredCapability)
    )
  );
  readonly itemSelected = output<void>();

  onItemSelected(): void {
    this.itemSelected.emit();
  }

  activeRoute(route: string): boolean {
    const url = this.router.url;
    return url === route || url.startsWith(route + '/');
  }
}
