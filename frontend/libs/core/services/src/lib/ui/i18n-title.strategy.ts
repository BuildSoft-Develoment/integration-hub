import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18nService } from '@integration-hub/core/i18n';
import { ThemeService } from './theme.service';

@Injectable({ providedIn: 'root' })
export class I18nTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18nService);
  private readonly theme = inject(ThemeService);

  override updateTitle(routerState: RouterStateSnapshot): void {
    // La marca (white-label) manda el titulo base; fallback al nombre por defecto.
    const baseTitle = this.theme.brandName();
    const titleKey = this.resolveTitleKey(routerState.root);
    if (titleKey) {
      const resolved = this.i18n.t(titleKey);
      this.title.setTitle(`${resolved} — ${baseTitle}`);
    } else {
      this.title.setTitle(baseTitle);
    }
  }

  private resolveTitleKey(route: ActivatedRouteSnapshot | null): string | null {
    if (!route) {
      return null;
    }
    if (route.data?.['titleKey']) {
      return route.data['titleKey'] as string;
    }
    for (const child of route.children) {
      const found = this.resolveTitleKey(child);
      if (found) {
        return found;
      }
    }
    return null;
  }
}
