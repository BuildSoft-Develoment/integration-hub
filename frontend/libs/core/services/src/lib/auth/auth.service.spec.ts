import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

/** Fake mínimo de keycloak-js: solo lo que leen freshToken/forceRefresh/syncFromKeycloak. */
function fakeKeycloak(overrides: Partial<{ token: string; updateToken: (m: number) => Promise<boolean> }> = {}) {
  return {
    token: overrides.token ?? 'fresh-token',
    authenticated: true,
    tokenParsed: { preferred_username: 'u', realm_access: { roles: ['role-a'] } },
    updateToken: overrides.updateToken ?? (async () => true),
  };
}

describe('AuthService token refresh', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  describe('freshToken (1)', () => {
    it('refreshes and returns the fresh token when authenticated', async () => {
      (service as unknown as { keycloak: unknown }).keycloak = fakeKeycloak({ token: 'fresh-token' });
      service.authenticated.set(true);
      service.accessToken.set('stale');

      const token = await service.freshToken(30);

      expect(token).toBe('fresh-token');
      expect(service.accessToken()).toBe('fresh-token');
    });

    it('does NOT reset state on a transient refresh failure — keeps current token (3)', async () => {
      (service as unknown as { keycloak: unknown }).keycloak = fakeKeycloak({
        updateToken: async () => {
          throw new Error('network blip');
        },
      });
      service.authenticated.set(true);
      service.accessToken.set('still-valid');

      const token = await service.freshToken(30);

      expect(token).toBe('still-valid');
      expect(service.authenticated()).toBe(true); // no reset -> el próximo request no queda sin token
    });

    it('passes through (no keycloak / guest) returning the current token', async () => {
      service.authenticated.set(false);
      service.accessToken.set('');

      expect(await service.freshToken(30)).toBe('');
    });
  });

  describe('forceRefresh (2)', () => {
    it('forces a refresh and returns the new token on 401 recovery', async () => {
      (service as unknown as { keycloak: unknown }).keycloak = fakeKeycloak({ token: 'recovered' });
      service.authenticated.set(true);
      service.accessToken.set('expired');

      const token = await service.forceRefresh();

      expect(token).toBe('recovered');
      expect(service.accessToken()).toBe('recovered');
    });

    it('resets state and returns empty when the SSO/refresh-token is dead', async () => {
      (service as unknown as { keycloak: unknown }).keycloak = fakeKeycloak({
        updateToken: async () => {
          throw new Error('session dead');
        },
      });
      service.authenticated.set(true);
      service.accessToken.set('expired');

      const token = await service.forceRefresh();

      expect(token).toBe('');
      expect(service.authenticated()).toBe(false); // sesión expirada real -> re-login
      expect(service.accessToken()).toBe('');
    });
  });
});
