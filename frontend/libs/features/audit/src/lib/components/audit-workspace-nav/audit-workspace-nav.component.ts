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

  readonly items = computed(() =>
    this.plugins.workspaces()
      .filter((item) => item.group === 'audit')
      .filter(
        (item) =>
          item.requiredCapability == null ||
          this.access.hasCapability(item.requiredCapability)
      )
  );

  modeLabelKey(mode: AppWorkspaceContribution['mode']): string {
    return mode === 'operation'
      ? 'audit.workspace.modeOperation'
      : 'audit.workspace.modeQuery';
  }
}
