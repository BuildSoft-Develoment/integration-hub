import {
  AppNavigationContribution,
  AppPluginManifest,
  AppRouteContribution,
  AppWorkspaceContribution,
} from '../navigation/app-navigation.models';
import { normalizeNavigationContributions } from '../navigation/app-navigation.registry';

export const FRONTEND_EXTENSION_PLATFORM_VERSION = '1.0.0';

export interface AppPluginRegistryOptions {
  readonly platformVersion?: string;
  readonly allowCompatibleMajor?: boolean;
}

export interface AppPluginRegistrySnapshot {
  readonly manifests: readonly AppPluginManifest[];
  readonly navigation: readonly AppNavigationContribution[];
  readonly routes: readonly AppRouteContribution[];
  readonly workspaces: readonly AppWorkspaceContribution[];
  readonly capabilities: readonly string[];
}

export function buildAppPluginRegistry(
  manifests: readonly AppPluginManifest[],
  options: AppPluginRegistryOptions = {}
): AppPluginRegistrySnapshot {
  const platformVersion = options.platformVersion ?? FRONTEND_EXTENSION_PLATFORM_VERSION;
  const allowCompatibleMajor = options.allowCompatibleMajor ?? true;
  const normalizedManifests = manifests.map(normalizeManifest);

  assertUnique(
    normalizedManifests,
    (manifest) => manifest.id,
    'plugin id'
  );

  for (const manifest of normalizedManifests) {
    assertCompatiblePlatformVersion(manifest, platformVersion, allowCompatibleMajor);
  }

  const navigation = normalizeNavigationContributions(
    normalizedManifests.flatMap((manifest) =>
      (manifest.navigation ?? []).map((item, index) => ({
        ...item,
        source: item.source ?? manifest.id,
        order: item.order ?? index * 100,
      }))
    )
  );

  const routes = normalizedManifests.flatMap((manifest) =>
    (manifest.routes ?? []).map((route) => ({
      ...route,
      source: route.source ?? manifest.id,
    }))
  );
  assertUnique(routes, (route) => route.id, 'route id');
  assertUnique(routes, (route) => normalizeRoutePath(route.path), 'route path');

  const workspaces = normalizedManifests
    .flatMap((manifest) =>
      (manifest.workspaces ?? []).map((workspace, index) => ({
        ...workspace,
        source: workspace.source ?? manifest.id,
        order: workspace.order ?? index * 100,
      }))
    )
    .sort((a, b) => {
      const byOrder = (a.order ?? 0) - (b.order ?? 0);
      return byOrder !== 0 ? byOrder : a.id.localeCompare(b.id);
    });
  assertUnique(workspaces, (workspace) => workspace.id, 'workspace id');
  assertUnique(workspaces, (workspace) => normalizeRoutePath(workspace.route), 'workspace route');

  return {
    manifests: [...normalizedManifests].sort((a, b) => a.id.localeCompare(b.id)),
    navigation,
    routes,
    workspaces,
    capabilities: unique(normalizedManifests.flatMap((manifest) => manifest.capabilities ?? [])),
  };
}

function normalizeManifest(manifest: AppPluginManifest): AppPluginManifest {
  assertRequired(manifest.id, 'plugin id');
  assertRequired(manifest.version, `plugin ${manifest.id} version`);
  assertRequired(manifest.platformVersion, `plugin ${manifest.id} platformVersion`);
  assertRequired(manifest.displayName, `plugin ${manifest.id} displayName`);
  return manifest;
}

function assertCompatiblePlatformVersion(
  manifest: AppPluginManifest,
  platformVersion: string,
  allowCompatibleMajor: boolean
): void {
  if (manifest.platformVersion === platformVersion) {
    return;
  }

  if (allowCompatibleMajor && majorOf(manifest.platformVersion) === majorOf(platformVersion)) {
    return;
  }

  throw new Error(
    `Plugin "${manifest.id}" targets platform "${manifest.platformVersion}" but current frontend extension platform is "${platformVersion}".`
  );
}

function assertRequired(value: string, field: string): void {
  if (!value.trim()) {
    throw new Error(`Invalid ${field}: value is required.`);
  }
}

function assertUnique<T>(
  items: readonly T[],
  selectKey: (item: T) => string,
  label: string
): void {
  const seen = new Set<string>();
  for (const item of items) {
    const key = selectKey(item);
    if (seen.has(key)) {
      throw new Error(`Duplicate plugin contribution ${label} "${key}".`);
    }
    seen.add(key);
  }
}

function majorOf(version: string): string {
  return version.split('.')[0] ?? version;
}

function normalizeRoutePath(path: string): string {
  return `/${path.replace(/^\/+/, '')}`;
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
