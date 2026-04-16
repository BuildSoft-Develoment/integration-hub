import { CommonModule } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthAccessService, I18nService } from '@integration-hub/core/services';

import { APP_NAVIGATION_ITEMS } from './app-navigation.token';

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
  private readonly navigationItems = inject(APP_NAVIGATION_ITEMS);
  readonly items = computed(() =>
    this.navigationItems.filter(
      (item) =>
        item.requiredCapability == null ||
        this.access.hasCapability(item.requiredCapability)
    )
  );
  readonly itemSelected = output<void>();

  onItemSelected(): void {
    this.itemSelected.emit();
  }
}
