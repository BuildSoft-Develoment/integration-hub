import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthAccessService, AuthCapability } from './auth-access.service';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  return authService.ensureAuthenticated();
};

export function roleGuard(roles: readonly string[]): CanActivateFn {
  return async () => {
    const authService = inject(AuthService);
    const authenticated = await authService.ensureAuthenticated();

    if (!authenticated) {
      return false;
    }

    return authService.hasAnyRole(roles);
  };
}

export function capabilityGuard(capability: AuthCapability): CanActivateFn {
  return async () => {
    const authService = inject(AuthService);
    const authAccess = inject(AuthAccessService);
    const authenticated = await authService.ensureAuthenticated();

    if (!authenticated) {
      return false;
    }

    return authAccess.hasCapability(capability);
  };
}
