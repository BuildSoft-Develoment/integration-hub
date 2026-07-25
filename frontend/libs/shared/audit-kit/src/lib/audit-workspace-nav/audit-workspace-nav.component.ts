import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthAccessService, I18nService } from '@integration-hub/core/services';
import { AppWorkspaceContribution, AppPluginRuntimeRegistry } from '@integration-hub/shared/ui';
import { AuditDomainGroup, groupAuditWorkspacesByDomain } from '../audit-workspace-groups';

/**
 * Sub-nav del pack activo (ADR-019 hub de dos niveles): dentro de un pack muestra SOLO las herramientas
 * de ese dominio + un "volver al hub". El dominio activo se detecta por la contribucion cuyo `route`
 * prefija la URL (match mas largo), asi una pagina nueva no necesita declarar su dominio.
 */
@Component({
  selector: 'ih-audit-workspace-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './audit-workspace-nav.component.html',
  styleUrl: './audit-workspace-nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditWorkspaceNavComponent {
  readonly i18n = inject(I18nService);
  readonly access = inject(AuthAccessService);
  private readonly plugins = inject(AppPluginRuntimeRegistry);
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  private readonly domains = computed<AuditDomainGroup[]>(() =>
    groupAuditWorkspacesByDomain(
      this.plugins
        .workspaces()
        .filter((item) => item.group === 'audit')
        .filter((item) => item.requiredCapability == null || this.access.hasCapability(item.requiredCapability))
    )
  );

  readonly activeGroup = computed<AuditDomainGroup | null>(() => {
    const url = this.currentUrl().split('?')[0];
    let best: AuditDomainGroup | null = null;
    let bestLen = -1;
    for (const group of this.domains()) {
      for (const item of group.items) {
        const matches = url === item.route || url.startsWith(item.route + '/');
        if (matches && item.route.length > bestLen) {
          best = group;
          bestLen = item.route.length;
        }
      }
    }
    return best;
  });

  modeLabelKey(mode: AppWorkspaceContribution['mode']): string {
    return mode === 'operation' ? 'audit.workspace.modeOperation' : 'audit.workspace.modeQuery';
  }
}
