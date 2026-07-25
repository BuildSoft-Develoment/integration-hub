import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthAccessService, I18nService } from '@integration-hub/core/services';
import { AppWorkspaceContribution, AppPluginRuntimeRegistry } from '@integration-hub/shared/ui';
import { AuditDomainGroup, groupAuditWorkspacesByDomain } from '../audit-workspace-groups';

/**
 * Hub de auditoria (ADR-019, nivel 1): una tarjeta por dominio/pack (Generico, SWIFT MT101, y a futuro
 * ISO 20022/MT103). Cada tarjeta lista las herramientas del pack como enlaces directos a sus formularios.
 * Escala de a una tarjeta por estandar, sin llenar cada pantalla de cajas.
 */
@Component({
  selector: 'ih-audit-pack-hub',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './audit-pack-hub.component.html',
  styleUrl: './audit-pack-hub.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditPackHubComponent {
  readonly i18n = inject(I18nService);
  private readonly access = inject(AuthAccessService);
  private readonly plugins = inject(AppPluginRuntimeRegistry);

  readonly domains = computed<AuditDomainGroup[]>(() =>
    groupAuditWorkspacesByDomain(
      this.plugins
        .workspaces()
        .filter((item) => item.group === 'audit')
        .filter((item) => item.requiredCapability == null || this.access.hasCapability(item.requiredCapability))
    )
  );

  modeLabelKey(mode: AppWorkspaceContribution['mode']): string {
    return mode === 'operation' ? 'audit.workspace.modeOperation' : 'audit.workspace.modeQuery';
  }
}
