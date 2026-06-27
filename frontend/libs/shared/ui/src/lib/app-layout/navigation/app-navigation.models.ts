import { AuthCapability } from '@integration-hub/core/services';
import { Route } from '@angular/router';

export interface AppNavigationItem {
  readonly id: string;
  readonly route: string;
  readonly labelKey: string;
  readonly requiredCapability?: AuthCapability | null;
}

export interface AppNavigationContribution extends AppNavigationItem {
  readonly source?: string;
  readonly order?: number;
  readonly group?: string;
}

export interface AppRouteContribution {
  readonly id: string;
  readonly path: string;
  readonly source?: string;
  readonly titleKey?: string;
  readonly requiredCapability?: AuthCapability | null;
  readonly loadChildren?: Route['loadChildren'];
  readonly loadComponent?: Route['loadComponent'];
  readonly children?: Route['children'];
  readonly redirectTo?: Route['redirectTo'];
  readonly pathMatch?: Route['pathMatch'];
  readonly data?: Route['data'];
}

export interface AppWorkspaceContribution {
  readonly id: string;
  readonly route: string;
  readonly labelKey: string;
  readonly descriptionKey?: string;
  readonly source?: string;
  readonly group?: string;
  readonly mode?: 'query' | 'operation' | 'configuration';
  readonly order?: number;
  readonly requiredCapability?: AuthCapability | null;
}

export interface AppPluginManifest {
  readonly id: string;
  readonly version: string;
  readonly platformVersion: string;
  readonly displayName: string;
  readonly capabilities?: readonly AuthCapability[];
  readonly navigation?: readonly AppNavigationContribution[];
  readonly routes?: readonly AppRouteContribution[];
  readonly workspaces?: readonly AppWorkspaceContribution[];
  readonly i18nNamespaces?: readonly string[];
}
