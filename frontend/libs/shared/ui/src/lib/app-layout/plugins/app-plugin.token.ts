import {
  ENVIRONMENT_INITIALIZER,
  EnvironmentProviders,
  inject,
  InjectionToken,
  provideAppInitializer,
  Provider,
} from '@angular/core';

import { AppPluginManifest } from '../navigation/app-navigation.models';
import { provideAppNavigationContributions } from '../navigation/app-navigation.token';
import { provideAppWorkspaceContributions } from './app-workspace.token';
import {
  AppPluginRegistryOptions,
  buildAppPluginRegistry,
} from './app-plugin.registry';
import { AppPluginRuntimeRegistry } from './app-plugin-runtime.registry';

export const APP_PLUGIN_MANIFESTS = new InjectionToken<readonly AppPluginManifest[]>(
  'APP_PLUGIN_MANIFESTS'
);

export function provideAppPluginManifests(
  manifests: readonly AppPluginManifest[]
): Provider[] {
  return [
    ...manifests.map((manifest) => ({
      provide: APP_PLUGIN_MANIFESTS,
      multi: true,
      useValue: manifest,
    })),
    ...manifests.flatMap((manifest) =>
      provideAppNavigationContributions(manifest.navigation ?? [], manifest.id)
    ),
    ...manifests.flatMap((manifest) =>
      provideAppWorkspaceContributions(manifest.workspaces ?? [], manifest.id)
    ),
  ];
}

export function provideAppPluginRegistryValidation(
  options: AppPluginRegistryOptions = {}
): Provider {
  return {
    provide: ENVIRONMENT_INITIALIZER,
    multi: true,
    useValue: () => {
      const manifests = inject(APP_PLUGIN_MANIFESTS, { optional: true }) ?? [];
      buildAppPluginRegistry(manifests, options);
    },
  };
}

export interface ExternalAppPluginManifestCatalogOptions {
  readonly url?: string;
  readonly optional?: boolean;
}

export function provideExternalAppPluginManifestCatalog(
  options: ExternalAppPluginManifestCatalogOptions = {}
): EnvironmentProviders {
  return provideAppInitializer(async () => {
    await inject(AppPluginRuntimeRegistry).loadExternalManifestCatalog(
      options.url ?? '/plugins/catalog.json',
      options.optional ?? true
    );
  });
}
