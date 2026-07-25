import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthAccessService, I18nService } from '@integration-hub/core/services';
import {
  AppWorkspaceContribution,
  AppPluginRuntimeRegistry,
} from '@integration-hub/shared/ui';

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

  /**
   * Cajas de auditoria agrupadas por dominio (ADR-019): generico de plataforma vs herramientas de un
   * estandar (SWIFT MT101, y a futuro ISO 20022/MT103). Los grupos se ordenan por `domainOrder`; dentro
   * de cada grupo se respeta el orden del registro. El `mode` baja a tag secundario dentro de la caja.
   */
  readonly groups = computed(() => {
    const items = this.plugins
      .workspaces()
      .filter((item) => item.group === 'audit')
      .filter(
        (item) =>
          item.requiredCapability == null ||
          this.access.hasCapability(item.requiredCapability)
      );

    const byDomain = new Map<
      string,
      { domain: string; labelKey: string | null; order: number; items: AppWorkspaceContribution[] }
    >();
    for (const item of items) {
      const domain = item.domain ?? 'other';
      let group = byDomain.get(domain);
      if (!group) {
        group = { domain, labelKey: item.domainLabelKey ?? null, order: item.domainOrder ?? 999, items: [] };
        byDomain.set(domain, group);
      }
      group.items.push(item);
    }
    return [...byDomain.values()].sort((a, b) => a.order - b.order);
  });

  modeLabelKey(mode: AppWorkspaceContribution['mode']): string {
    return mode === 'operation'
      ? 'audit.workspace.modeOperation'
      : 'audit.workspace.modeQuery';
  }
}
