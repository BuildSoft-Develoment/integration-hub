import { computed, Injectable, signal } from '@angular/core';
import Keycloak, { KeycloakProfile } from 'keycloak-js';

declare global {
  interface Window {
    __ihConfig?: {
      keycloak?: {
        url?: string;
        realm?: string;
        clientId?: string;
      };
    };
  }
}

export interface AuthConfig {
  url: string;
  realm: string;
  clientId: string;
}

const KEYCLOAK_DEFAULTS: AuthConfig = {
  url: 'http://localhost:8180',
  realm: 'integration-hub',
  clientId: 'integration-hub-ui',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private keycloak: Keycloak | null = null;

  readonly ready = signal(false);
  readonly authenticated = signal(false);
  readonly accessToken = signal('');
  readonly username = signal('');
  readonly realmRoles = signal<string[]>([]);

  readonly config = computed<AuthConfig>(() => ({
    ...KEYCLOAK_DEFAULTS,
    ...(window.__ihConfig?.keycloak ?? {}),
  }));

  readonly isConfigured = computed(() => {
    const current = this.config();
    return Boolean(current.url && current.realm && current.clientId);
  });

  async initialize(): Promise<void> {
    if (!this.isConfigured()) {
      this.ready.set(true);
      return;
    }

    const client = new Keycloak(this.config());
    this.keycloak = client;

    try {
      const authenticated = await client.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      });

      this.authenticated.set(authenticated);
      this.syncFromKeycloak(client);

      client.onTokenExpired = () => {
        client
          .updateToken(30)
          .then(() => this.syncFromKeycloak(client))
          // (3) Endurecer: un fallo TRANSITORIO del refresh en background NO debe resetear el estado (eso dejaría
          // los próximos requests sin token → 401 espurio). El refresh proactivo del interceptor (1) o la
          // recuperación del 401 (2) reintentan; solo el refresh forzado que falla (forceRefresh) resetea.
          .catch(() => undefined);
      };
    } catch {
      this.reset();
    } finally {
      this.ready.set(true);
    }
  }

  async login(): Promise<void> {
    await this.keycloak?.login({
      redirectUri: window.location.href,
    });
  }

  async logout(): Promise<void> {
    if (!this.keycloak) {
      this.reset();
      return;
    }

    await this.keycloak.logout({
      redirectUri: window.location.origin,
    });
  }

  async ensureAuthenticated(): Promise<boolean> {
    if (!this.ready()) {
      return false;
    }

    if (this.authenticated()) {
      return true;
    }

    await this.login();
    return false;
  }

  /**
   * (1) Refresco proactivo: si el access-token vence dentro de {@code minValidity}s, lo refresca con el refresh-token
   * (sesión SSO) y sincroniza el estado; devuelve el token vigente. {@code updateToken} NO hace red si el token aún
   * es válido (solo chequeo local de expiración), así que es barato por-request. Ante un fallo transitorio del
   * refresh NO resetea el estado: devuelve el token actual y deja que la recuperación del 401 decida.
   */
  async freshToken(minValidity = 30): Promise<string> {
    const client = this.keycloak;
    if (!client || !this.authenticated()) {
      return this.accessToken();
    }
    try {
      await client.updateToken(minValidity);
      this.syncFromKeycloak(client);
    } catch {
      // Fallo transitorio: mantené el token actual; si de verdad venció, el back dará 401 y forceRefresh actuará.
    }
    return this.accessToken();
  }

  /**
   * (2) Recuperación ante 401: fuerza el refresh del token ({@code updateToken(-1)}) ignorando la validez. Devuelve el
   * token nuevo, o {@code ''} si el refresh-token / sesión SSO ya no es válido (ahí sí es sesión expirada real y hay
   * que re-loguear) — en ese caso resetea el estado.
   */
  async forceRefresh(): Promise<string> {
    const client = this.keycloak;
    if (!client || !this.authenticated()) {
      return this.accessToken();
    }
    try {
      await client.updateToken(-1);
      this.syncFromKeycloak(client);
      return this.accessToken();
    } catch {
      this.reset();
      return '';
    }
  }

  hasRole(role: string): boolean {
    return this.realmRoles().includes(role);
  }

  hasAnyRole(roles: readonly string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  private syncFromKeycloak(client: Keycloak): void {
    const parsed = client.tokenParsed as (KeycloakProfile & {
      preferred_username?: string;
      realm_access?: { roles?: string[] };
    }) | null;

    this.accessToken.set(client.token ?? '');
    this.username.set(
      parsed?.preferred_username || parsed?.username || parsed?.firstName || 'user'
    );
    this.realmRoles.set(parsed?.realm_access?.roles ?? []);
    this.authenticated.set(Boolean(client.authenticated));
  }

  private reset(): void {
    this.authenticated.set(false);
    this.accessToken.set('');
    this.username.set('');
    this.realmRoles.set([]);
  }
}
