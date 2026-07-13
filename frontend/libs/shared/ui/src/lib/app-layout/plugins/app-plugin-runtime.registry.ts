import {
  computed,
  inject,
  Injectable,
  InjectionToken,
  Provider,
  signal,
} from '@angular/core';

import {
  AppActionContribution,
  AppNavigationContribution,
  AppPluginManifest,
  AppRouteContribution,
  AppWorkspaceContribution,
} from '../navigation/app-navigation.models';
import { APP_PLUGIN_MANIFESTS } from './app-plugin.token';
import {
  buildAppPluginRegistry,
  FRONTEND_EXTENSION_PLATFORM_VERSION,
} from './app-plugin.registry';

export interface AppPluginManifestCatalog {
  readonly manifests?: readonly AppPluginManifest[];
}

/** A plugin that failed installation and was quarantined, with the reason. */
export interface RejectedPluginManifest {
  readonly id: string;
  readonly reason: string;
}

/** Outcome of a resilient installation: which plugins loaded and which were quarantined. */
export interface PluginInstallationReport {
  readonly accepted: readonly string[];
  readonly rejected: readonly RejectedPluginManifest[];
}

/** Summary of an installed plugin for diagnostic/admin surfaces. */
export interface InstalledPluginInfo {
  readonly id: string;
  readonly displayName: string;
  readonly version: string;
  readonly origin: 'static' | 'external';
}

/** Observable state of the plugin runtime: installed, quarantined and degraded plugins. */
export interface PluginDiagnostics {
  readonly installed: readonly InstalledPluginInfo[];
  readonly quarantined: readonly RejectedPluginManifest[];
  readonly degraded: readonly RejectedPluginManifest[];
}

/**
 * Allowlist of origins (e.g. `https://plugins.example.com`) from which a plugin
 * `remote` entry may be loaded. Empty by default, so no remote origin is trusted
 * unless explicitly configured (fail-safe). See ADR-013.
 */
export const APP_PLUGIN_REMOTE_ALLOWED_ORIGINS = new InjectionToken<readonly string[]>(
  'APP_PLUGIN_REMOTE_ALLOWED_ORIGINS'
);

export function provideAppPluginRemoteOrigins(origins: readonly string[]): Provider {
  return { provide: APP_PLUGIN_REMOTE_ALLOWED_ORIGINS, useValue: origins };
}

/**
 * Allowlist of signing key identifiers trusted to sign plugin remotes. A remote
 * `signature` must be `keyId:base64signature` whose `keyId` is in this list.
 * Empty by default (fail-safe). The cryptographic verification of the signature
 * bytes against the fetched remote entry is performed at load time. See ADR-013.
 */
export const APP_PLUGIN_REMOTE_TRUSTED_KEYS = new InjectionToken<readonly string[]>(
  'APP_PLUGIN_REMOTE_TRUSTED_KEYS'
);

export function provideAppPluginRemoteTrustedKeys(keyIds: readonly string[]): Provider {
  return { provide: APP_PLUGIN_REMOTE_TRUSTED_KEYS, useValue: keyIds };
}

/** Fetch usado para leer los catalogos de manifests externos. */
export type AppPluginCatalogFetch = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Seam para el fetch de catalogos (mismo patron que APP_PLUGIN_REMOTE_FETCH del verifier):
 * mantiene shared/ui agnostico de HttpClient. Por defecto usa `fetch` global (sin auth), lo
 * que basta para catalogos estaticos publicos; para un catalogo backend securizado
 * (p.ej. /api/plugins/ui-catalog) la app provee un fetch que adjunta el bearer token.
 */
export const APP_PLUGIN_CATALOG_FETCH = new InjectionToken<AppPluginCatalogFetch>(
  'APP_PLUGIN_CATALOG_FETCH'
);

export function provideAppPluginCatalogFetch(fetchImpl: AppPluginCatalogFetch): Provider {
  return { provide: APP_PLUGIN_CATALOG_FETCH, useValue: fetchImpl };
}

@Injectable({ providedIn: 'root' })
export class AppPluginRuntimeRegistry {
  private readonly staticManifests = inject(APP_PLUGIN_MANIFESTS, { optional: true }) ?? [];
  private readonly allowedRemoteOrigins =
    inject(APP_PLUGIN_REMOTE_ALLOWED_ORIGINS, { optional: true }) ?? [];
  private readonly trustedRemoteKeys =
    inject(APP_PLUGIN_REMOTE_TRUSTED_KEYS, { optional: true }) ?? [];
  private readonly catalogFetch: AppPluginCatalogFetch =
    inject(APP_PLUGIN_CATALOG_FETCH, { optional: true }) ?? ((url, init) => fetch(url, init));
  private readonly externalManifests = signal<readonly AppPluginManifest[]>([]);
  private readonly rejectedManifests = signal<readonly RejectedPluginManifest[]>([]);
  private readonly degradedManifests = signal<readonly RejectedPluginManifest[]>([]);

  /** Plugins quarantined during the last resilient installation, with reasons. */
  readonly rejected = computed(() => this.rejectedManifests());

  /** Plugins accepted as metadata but failed to load/mount their remote code. */
  readonly degraded = computed(() => this.degradedManifests());

  /** Installed, quarantined and degraded plugins, for diagnostic/admin surfaces. */
  readonly diagnostics = computed<PluginDiagnostics>(() => ({
    installed: [
      ...this.staticManifests.map((manifest) => describeInstalled(manifest, 'static')),
      ...this.externalManifests().map((manifest) => describeInstalled(manifest, 'external')),
    ],
    quarantined: this.rejectedManifests(),
    degraded: this.degradedManifests(),
  }));

  /**
   * Marks a plugin as degraded: it passed the metadata gate but its remote code
   * could not be verified, loaded or mounted. Used by the remote loader as an
   * error boundary so a failing plugin never breaks the shell.
   */
  markDegraded(id: string, reason: string): void {
    this.degradedManifests.update((current) => [
      ...current.filter((entry) => entry.id !== id),
      { id, reason },
    ]);
  }

  private readonly knownStaticRoutes = new Set(
    this.staticManifests.flatMap((manifest) => [
      ...(manifest.routes ?? []).map((route) => normalizeRoute(route.path)),
      ...(manifest.navigation ?? []).map((item) => normalizeRoute(item.route)),
      ...(manifest.workspaces ?? []).map((workspace) => normalizeRoute(workspace.route)),
    ])
  );

  readonly manifests = computed(() => [
    ...this.staticManifests,
    ...this.externalManifests(),
  ]);

  readonly snapshot = computed(() => buildAppPluginRegistry(this.manifests()));
  readonly navigation = computed(() => this.snapshot().navigation);
  readonly workspaces = computed(() => this.snapshot().workspaces);
  readonly actions = computed(() => this.snapshot().actions);

  registerExternalManifests(manifests: readonly AppPluginManifest[]): void {
    const sanitized = manifests.map((manifest) => sanitizeExternalManifest(manifest));
    this.assertExternalRoutesAreMetadataOnly(sanitized);
    this.assertExternalLinksTargetKnownRoutes(sanitized);
    this.assertExternalActionLinksAreSafe(sanitized);
    this.assertContributedKeysWithinDeclaredNamespaces(sanitized);
    this.assertExternalRemoteIsTrusted(sanitized);

    this.externalManifests.set(sanitized);
    this.snapshot();
  }

  /**
   * Resilient counterpart of {@link registerExternalManifests} for plugins installed
   * from outside the build. Each manifest is validated in isolation against the
   * platform and the already-accepted plugins; valid ones are loaded while invalid
   * or conflicting ones are quarantined with a reason. This never throws, so a single
   * bad plugin can never break the shell or block the rest of the catalog.
   */
  installExternalManifests(
    manifests: readonly AppPluginManifest[]
  ): PluginInstallationReport {
    const accepted: AppPluginManifest[] = [];
    const rejected: RejectedPluginManifest[] = [];

    for (const candidate of manifests) {
      const id = candidate?.id?.trim() || '(unknown)';
      try {
        const sanitized = sanitizeExternalManifest(candidate);
        this.assertExternalRoutesAreMetadataOnly([sanitized]);
        this.assertExternalLinksTargetKnownRoutes([sanitized]);
        this.assertExternalActionLinksAreSafe([sanitized]);
        this.assertContributedKeysWithinDeclaredNamespaces([sanitized]);
        this.assertExternalRemoteIsTrusted([sanitized]);
        // Trial-build the snapshot incrementally so the candidate is checked for
        // compatibility and id/route/workspace/action conflicts against the
        // platform and every plugin already accepted in this batch.
        buildAppPluginRegistry([...this.staticManifests, ...accepted, sanitized], {
          platformVersion: FRONTEND_EXTENSION_PLATFORM_VERSION,
        });
        accepted.push(sanitized);
      } catch (error) {
        rejected.push({ id, reason: errorMessage(error) });
      }
    }

    this.externalManifests.set(accepted);
    this.rejectedManifests.set(rejected);
    return { accepted: accepted.map((manifest) => manifest.id), rejected };
  }

  /**
   * Validates a candidate external manifest against every gate WITHOUT installing it or
   * mutating the registry, for an admin "preview" surface (symmetric to the backend
   * marketplace preview). Reports whether it would be accepted or the quarantine reason.
   */
  previewExternalManifest(candidate: AppPluginManifest): RejectedPluginManifest & { accepted: boolean } {
    const id = candidate?.id?.trim() || '(unknown)';
    try {
      const sanitized = sanitizeExternalManifest(candidate);
      this.assertExternalRoutesAreMetadataOnly([sanitized]);
      this.assertExternalLinksTargetKnownRoutes([sanitized]);
      this.assertExternalActionLinksAreSafe([sanitized]);
      this.assertContributedKeysWithinDeclaredNamespaces([sanitized]);
      this.assertExternalRemoteIsTrusted([sanitized]);
      buildAppPluginRegistry([...this.staticManifests, ...this.externalManifests(), sanitized], {
        platformVersion: FRONTEND_EXTENSION_PLATFORM_VERSION,
      });
      return { id, accepted: true, reason: '' };
    } catch (error) {
      return { id, accepted: false, reason: errorMessage(error) };
    }
  }

  async loadExternalManifestCatalog(url: string, optional = true): Promise<void> {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      if (optional && response.status === 404) {
        return;
      }
      throw new Error(`Unable to load plugin manifest catalog "${url}": HTTP ${response.status}.`);
    }

    const catalog = (await response.json()) as AppPluginManifestCatalog | AppPluginManifest[];
    const manifests = Array.isArray(catalog) ? catalog : catalog.manifests ?? [];

    // Plugins loaded from an external catalog are untrusted: install them
    // resiliently so a single malformed entry is quarantined, not fatal.
    this.installExternalManifests(manifests);
  }

  /**
   * Loads and MERGES several external manifest catalogs (e.g. a static file plus a
   * backend-managed catalog) into a single resilient install. Every source is optional
   * and non-fatal, so a missing or failing source never blocks the others or the shell.
   */
  async loadExternalManifestCatalogs(
    sources: readonly { readonly url: string; readonly optional?: boolean }[]
  ): Promise<void> {
    const manifests: AppPluginManifest[] = [];
    for (const source of sources) {
      manifests.push(...(await this.fetchCatalogManifests(source.url, source.optional ?? true)));
    }
    this.installExternalManifests(manifests);
  }

  private async fetchCatalogManifests(
    url: string,
    optional: boolean
  ): Promise<AppPluginManifest[]> {
    let response: Response;
    try {
      response = await this.catalogFetch(url, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
    } catch (error) {
      if (optional) {
        return [];
      }
      throw error;
    }
    if (!response.ok) {
      if (optional) {
        return [];
      }
      throw new Error(`Unable to load plugin manifest catalog "${url}": HTTP ${response.status}.`);
    }
    const catalog = (await response.json()) as AppPluginManifestCatalog | AppPluginManifest[];
    return Array.isArray(catalog) ? [...catalog] : [...(catalog.manifests ?? [])];
  }

  private assertExternalRoutesAreMetadataOnly(manifests: readonly AppPluginManifest[]): void {
    for (const manifest of manifests) {
      if ((manifest.routes ?? []).length) {
        throw new Error(
          `External metadata manifest "${manifest.id}" cannot declare Angular routes. Register code-bearing routes with provideAppPluginManifests(...).`
        );
      }
    }
  }

  private assertExternalLinksTargetKnownRoutes(manifests: readonly AppPluginManifest[]): void {
    for (const manifest of manifests) {
      const links = [
        ...(manifest.navigation ?? []).map((item) => ({
          kind: 'navigation',
          id: item.id,
          route: item.route,
        })),
        ...(manifest.workspaces ?? []).map((workspace) => ({
          kind: 'workspace',
          id: workspace.id,
          route: workspace.route,
        })),
        ...(manifest.actions ?? [])
          .filter((action) => action.kind === 'navigation' || (!action.kind && action.route))
          .map((action) => ({
            kind: 'action',
            id: action.id,
            route: action.route ?? '',
          })),
      ];

      for (const link of links) {
        const route = normalizeRoute(link.route);
        if (!this.knownStaticRoutes.has(route)) {
          throw new Error(
            `External plugin "${manifest.id}" declares ${link.kind} "${link.id}" for unknown route "${route}".`
          );
        }
      }
    }
  }

  private assertExternalActionLinksAreSafe(manifests: readonly AppPluginManifest[]): void {
    for (const manifest of manifests) {
      for (const action of manifest.actions ?? []) {
        if (action.kind !== 'external-link' && !(!action.kind && action.href)) {
          continue;
        }

        if (!action.href?.startsWith('https://')) {
          throw new Error(
            `External plugin "${manifest.id}" declares action "${action.id}" with an unsafe external href. Only https:// links are allowed.`
          );
        }
      }
    }
  }

  /**
   * Consumes the declared {@link AppPluginManifest.i18nNamespaces}: when a plugin
   * declares namespaces, every i18n key it contributes (navigation, workspaces,
   * actions and confirmations) must fall under one of them. This prevents an
   * external plugin from shadowing platform keys or another plugin's namespace.
   * Plugins that declare no namespace are not constrained (backward compatible).
   */
  private assertContributedKeysWithinDeclaredNamespaces(
    manifests: readonly AppPluginManifest[]
  ): void {
    for (const manifest of manifests) {
      const namespaces = (manifest.i18nNamespaces ?? [])
        .map((namespace) => namespace.trim())
        .filter((namespace) => namespace.length > 0);
      if (namespaces.length === 0) {
        continue;
      }

      for (const { field, key } of collectContributedI18nKeys(manifest)) {
        const withinNamespace = namespaces.some(
          (namespace) => key === namespace || key.startsWith(`${namespace}.`)
        );
        if (!withinNamespace) {
          throw new Error(
            `External plugin "${manifest.id}" contributes ${field} key "${key}" outside its declared i18n namespaces [${namespaces.join(', ')}].`
          );
        }
      }
    }
  }

  /**
   * Validates the optional {@link AppPluginManifest.remote} descriptor before any
   * Module Federation code is considered (see ADR-013). The remote entry must use
   * https, declare its exposed module, integrity and signature, and originate from
   * an allowlisted origin. Code is not mounted here: this only gates the contract.
   */
  private assertExternalRemoteIsTrusted(manifests: readonly AppPluginManifest[]): void {
    for (const manifest of manifests) {
      const remote = manifest.remote;
      if (!remote) {
        continue;
      }

      // https es obligatorio, salvo http hacia un host local (dev). Paridad con la
      // politica backend (PluginDescriptorTrustPolicy.isLocalHost): permite http en
      // localhost/127.0.0.1/::1 y exige https fuera de ahi. El origen sigue debiendo
      // estar en el allowlist mas abajo, asi que http://localhost no es un pase libre.
      const remoteUrl = remote.url ?? '';
      const safeScheme =
        remoteUrl.startsWith('https://') ||
        (remoteUrl.startsWith('http://') && isLocalRemoteUrl(remoteUrl));
      if (!safeScheme) {
        throw new Error(
          `External plugin "${manifest.id}" declares a remote with an unsafe url. Use https:// (http:// is allowed only for localhost dev).`
        );
      }

      for (const field of ['exposedModule', 'integrity', 'signature'] as const) {
        if (!remote[field]?.trim()) {
          throw new Error(`External plugin "${manifest.id}" remote is missing "${field}".`);
        }
      }

      if (!isSubresourceIntegrity(remote.integrity)) {
        throw new Error(
          `External plugin "${manifest.id}" remote integrity "${remote.integrity}" is not a valid SRI hash.`
        );
      }

      const origin = remoteOrigin(remote.url);
      if (!origin || !this.allowedRemoteOrigins.includes(origin)) {
        throw new Error(
          `External plugin "${manifest.id}" remote origin "${origin ?? remote.url}" is not in the allowed plugin origins.`
        );
      }

      const keyId = signatureKeyId(remote.signature);
      if (!keyId || !this.trustedRemoteKeys.includes(keyId)) {
        throw new Error(
          `External plugin "${manifest.id}" remote signature is not signed by a trusted key.`
        );
      }
    }
  }
}

function collectContributedI18nKeys(
  manifest: AppPluginManifest
): readonly { field: string; key: string }[] {
  const keys: { field: string; key: string }[] = [];

  for (const item of manifest.navigation ?? []) {
    if (item.labelKey) {
      keys.push({ field: `navigation "${item.id}"`, key: item.labelKey });
    }
  }
  for (const workspace of manifest.workspaces ?? []) {
    if (workspace.labelKey) {
      keys.push({ field: `workspace "${workspace.id}"`, key: workspace.labelKey });
    }
    if (workspace.descriptionKey) {
      keys.push({ field: `workspace "${workspace.id}" description`, key: workspace.descriptionKey });
    }
  }
  for (const action of manifest.actions ?? []) {
    if (action.labelKey) {
      keys.push({ field: `action "${action.id}"`, key: action.labelKey });
    }
    if (action.confirmation?.labelKey) {
      keys.push({ field: `action "${action.id}" confirmation`, key: action.confirmation.labelKey });
    }
  }

  return keys;
}

function sanitizeExternalManifest(manifest: AppPluginManifest): AppPluginManifest {
  return {
    id: manifest.id,
    version: manifest.version,
    platformVersion: manifest.platformVersion,
    displayName: manifest.displayName,
    capabilities: manifest.capabilities,
    i18nNamespaces: manifest.i18nNamespaces,
    navigation: manifest.navigation?.map((item): AppNavigationContribution => ({
      id: item.id,
      route: normalizeRoute(item.route),
      labelKey: item.labelKey,
      requiredCapability: item.requiredCapability,
      source: item.source,
      order: item.order,
      group: item.group,
    })),
    routes: sanitizeRouteMetadata(manifest.routes),
    workspaces: manifest.workspaces?.map((workspace): AppWorkspaceContribution => ({
      id: workspace.id,
      route: normalizeRoute(workspace.route),
      labelKey: workspace.labelKey,
      descriptionKey: workspace.descriptionKey,
      source: workspace.source,
      group: workspace.group,
      mode: workspace.mode,
      order: workspace.order,
      requiredCapability: workspace.requiredCapability,
    })),
    remote: manifest.remote
      ? {
          url: manifest.remote.url,
          exposedModule: manifest.remote.exposedModule,
          integrity: manifest.remote.integrity,
          signature: manifest.remote.signature,
          sharedDependencies: manifest.remote.sharedDependencies,
        }
      : undefined,
    actions: manifest.actions?.map((action): AppActionContribution => ({
      id: action.id,
      labelKey: action.labelKey,
      source: action.source,
      order: action.order,
      group: action.group,
      placement: action.placement,
      kind: action.kind,
      route: action.route ? normalizeRoute(action.route) : undefined,
      href: action.href,
      command: action.command,
      icon: action.icon,
      requiredCapability: action.requiredCapability,
      confirmation: action.confirmation
        ? {
            labelKey: action.confirmation.labelKey,
            severity: action.confirmation.severity,
          }
        : undefined,
    })),
  };
}

function sanitizeRouteMetadata(
  routes: readonly AppRouteContribution[] | undefined
): readonly AppRouteContribution[] | undefined {
  return routes?.map((route): AppRouteContribution => ({
    id: route.id,
    path: normalizeRoute(route.path),
    source: route.source,
    titleKey: route.titleKey,
    requiredCapability: route.requiredCapability,
    data: route.data,
  }));
}

function normalizeRoute(route: string): string {
  return `/${route.replace(/^\/+/, '')}`;
}

function describeInstalled(
  manifest: AppPluginManifest,
  origin: 'static' | 'external'
): InstalledPluginInfo {
  return {
    id: manifest.id,
    displayName: manifest.displayName,
    version: manifest.version,
    origin,
  };
}

function remoteOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * True si el host del remoto es loopback (dev local). Espeja
 * {@code PluginDescriptorTrustPolicy.isLocalHost} del backend para que http solo se
 * permita en localhost. `URL.hostname` devuelve `[::1]` con corchetes para IPv6.
 */
function isLocalRemoteUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '[::1]'
    );
  } catch {
    return false;
  }
}

function isSubresourceIntegrity(value: string): boolean {
  return /^(sha256|sha384|sha512)-[A-Za-z0-9+/]{16,}={0,2}$/.test(value.trim());
}

/**
 * Parses the trusted-signer identifier from a `keyId:base64signature` value,
 * or `null` when the format is invalid. The cryptographic verification of the
 * signature bytes happens at load time against the fetched remote entry.
 */
function signatureKeyId(signature: string): string | null {
  const match = /^([A-Za-z0-9._-]+):[A-Za-z0-9+/]{8,}={0,2}$/.exec(signature.trim());
  return match ? match[1] : null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
