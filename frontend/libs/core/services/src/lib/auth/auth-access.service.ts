import { computed, inject, Injectable } from '@angular/core';

import { AuthService } from './auth.service';

export type AuthCapability =
  | 'admin'
  | 'operate'
  | 'audit'
  | 'audit-read'
  | 'audit-operate'
  | 'audit-admin';

@Injectable({ providedIn: 'root' })
export class AuthAccessService {
  private readonly auth = inject(AuthService);

  readonly canAdmin = computed(
    () =>
      this.auth.hasRole('platform-admin') || this.auth.hasRole('integration-admin')
  );

  readonly canOperate = computed(
    () =>
      this.canAdmin() ||
      this.auth.hasRole('operator') ||
      this.auth.hasRole('payments-operator')
  );

  readonly canAudit = computed(
    () => this.canOperate() || this.auth.hasRole('auditor')
  );

  readonly canAuditRead = this.canAudit;
  readonly canAuditOperate = this.canOperate;
  readonly canAuditAdmin = this.canAdmin;

  readonly roleSummary = computed(() => {
    if (this.canAdmin()) {
      return 'Administracion completa';
    }

    if (this.canOperate()) {
      return 'Operacion y monitoreo';
    }

    if (this.canAudit()) {
      return 'Consulta y auditoria';
    }

    return 'Sin permisos';
  });

  hasCapability(capability: AuthCapability): boolean {
    switch (capability) {
      case 'admin':
        return this.canAdmin();
      case 'operate':
        return this.canOperate();
      case 'audit':
      case 'audit-read':
        return this.canAudit();
      case 'audit-operate':
        return this.canAuditOperate();
      case 'audit-admin':
        return this.canAuditAdmin();
    }
  }
}
