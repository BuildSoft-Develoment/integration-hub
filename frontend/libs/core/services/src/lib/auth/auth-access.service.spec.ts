import { TestBed } from '@angular/core/testing';

import { AuthAccessService } from './auth-access.service';
import { AuthService } from './auth.service';

function accessForRoles(roles: readonly string[]): AuthAccessService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      AuthAccessService,
      {
        provide: AuthService,
        useValue: {
          hasRole: (role: string) => roles.includes(role),
        },
      },
    ],
  });

  return TestBed.inject(AuthAccessService);
}

describe('AuthAccessService', () => {
  it('should treat payments-operator as an operational role', () => {
    const access = accessForRoles(['payments-operator']);

    expect(access.canAdmin()).toBe(false);
    expect(access.canOperate()).toBe(true);
    expect(access.canAudit()).toBe(true);
    expect(access.hasCapability('operate')).toBe(true);
    expect(access.hasCapability('audit-operate')).toBe(true);
    expect(access.hasCapability('audit-read')).toBe(true);
    expect(access.hasCapability('audit-admin')).toBe(false);
  });

  it('should keep auditors read-only', () => {
    const access = accessForRoles(['auditor']);

    expect(access.canAdmin()).toBe(false);
    expect(access.canOperate()).toBe(false);
    expect(access.canAudit()).toBe(true);
    expect(access.hasCapability('audit-read')).toBe(true);
    expect(access.hasCapability('audit-operate')).toBe(false);
  });
});
