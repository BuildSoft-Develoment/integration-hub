import { computed, inject, Injectable, signal } from '@angular/core';

import {
  AppNavigationContribution,
  AppPluginManifest,
  AppRouteContribution,
  AppWorkspaceContribution,
} from '../navigation/app-navigation.models';
import { APP_PLUGIN_MANIFESTS } from './app-plugin.token';
import { buildAppPluginRegistry } from './app-plugin.registry';

export interface AppPluginManifestCatalog {
  readonly manifests?: readonly AppPluginManifest[];
}

@Injectable({ providedIn: 'root' })
export class AppPluginRuntimeRegistry {
  private readonly staticManifests = inject(APP_PLUGIN_MANIFESTS, { optional: true }) ?? [];
  private readonly externalManifests = signal<readonly AppPluginManifest[]>([]);

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

  registerExternalManifests(manifests: readonly AppPluginManifest[]): void {
    const sanitized = manifests.map((manifest) => sanitizeExternalManifest(manifest));
    this.assertExternalRoutesAreMetadataOnly(sanitized);
    this.assertExternalLinksTargetKnownRoutes(sanitized);

    this.externalManifests.set(sanitized);
    this.snapshot();
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
    if (Array.isArray(catalog)) {
      this.registerExternalManifests(catalog);
      return;
    }

    this.registerExternalManifests(catalog.manifests ?? []);
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
