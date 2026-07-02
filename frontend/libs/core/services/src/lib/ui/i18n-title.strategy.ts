import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18nService } from '../i18n/i18n.service';

@Injectable({ providedIn: 'root' })
export class I18nTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18nService);
  private readonly baseTitle = 'Integration Hub';

  override updateTitle(routerState: RouterStateSnapshot): void {
    const titleKey = this.resolveTitleKey(routerState.root);
    if (titleKey) {
      const resolved = this.i18n.t(titleKey);
      this.title.setTitle(`${resolved} — ${this.baseTitle}`);
    } else {
      this.title.setTitle(this.baseTitle);
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
