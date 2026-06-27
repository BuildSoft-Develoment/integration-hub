import { Route } from '@angular/router';
import { authGuard, capabilityGuard } from '@integration-hub/core/services';

import {
  AppPluginManifest,
  AppRouteContribution,
} from '../navigation/app-navigation.models';
import {
  buildAppPluginRegistry,
  FRONTEND_EXTENSION_PLATFORM_VERSION,
} from './app-plugin.registry';

export interface AppPluginRouteShellOptions {
  readonly defaultRedirectTo?: string;
  readonly wildcardRedirectTo?: string;
}

export function buildAppRoutesFromContributions(
  routeContributions: readonly AppRouteContribution[],
  options: AppPluginRouteShellOptions = {}
): Route[] {
  return buildAppRoutesFromPluginManifests(
    [
      {
        id: 'route-shell',
        version: '1.0.0',
        platformVersion: FRONTEND_EXTENSION_PLATFORM_VERSION,
        displayName: 'Route Shell',
        routes: routeContributions,
      },
    ],
    options
  );
}

export function buildAppRoutesFromPluginManifests(
  manifests: readonly AppPluginManifest[],
  options: AppPluginRouteShellOptions = {}
): Route[] {
  const routes: Route[] = [];
  const defaultRedirectTo = options.defaultRedirectTo;
  const wildcardRedirectTo = options.wildcardRedirectTo ?? defaultRedirectTo;

  if (defaultRedirectTo) {
    routes.push({
      path: '',
      pathMatch: 'full',
      redirectTo: defaultRedirectTo,
    });
  }

  routes.push(
    ...buildAppPluginRegistry(manifests).routes.map(toAngularRoute)
  );

  if (wildcardRedirectTo) {
    routes.push({
      path: '**',
      redirectTo: wildcardRedirectTo,
    });
  }

  return routes;
}

function toAngularRoute(contribution: AppRouteContribution): Route {
  const data = {
    ...(contribution.data ?? {}),
    ...(contribution.titleKey ? { titleKey: contribution.titleKey } : {}),
    pluginSource: contribution.source,
    pluginRouteId: contribution.id,
  };

  return {
    path: normalizeRoutePath(contribution.path),
    ...(contribution.pathMatch ? { pathMatch: contribution.pathMatch } : {}),
    ...(contribution.redirectTo ? { redirectTo: contribution.redirectTo } : {}),
    ...(contribution.children ? { children: contribution.children } : {}),
    ...(contribution.loadChildren ? { loadChildren: contribution.loadChildren } : {}),
    ...(contribution.loadComponent ? { loadComponent: contribution.loadComponent } : {}),
    canActivate: contribution.requiredCapability
      ? [capabilityGuard(contribution.requiredCapability)]
      : [authGuard],
    data,
  };
}

function normalizeRoutePath(path: string): string {
  return path.replace(/^\/+/, '');
}
