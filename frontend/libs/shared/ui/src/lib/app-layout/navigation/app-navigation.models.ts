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

export type AppActionKind = 'command' | 'navigation' | 'external-link';
export type AppActionPlacement = 'global' | 'workspace' | 'record' | 'toolbar';

export interface AppActionContribution {
  readonly id: string;
  readonly labelKey: string;
  readonly source?: string;
  readonly order?: number;
  readonly group?: string;
  readonly placement?: AppActionPlacement;
  readonly kind?: AppActionKind;
  readonly route?: string;
  readonly href?: string;
  readonly command?: string;
  readonly icon?: string;
  readonly requiredCapability?: AuthCapability | null;
  readonly confirmation?: {
    readonly labelKey?: string;
    readonly severity?: 'danger' | 'warning';
  };
}

/**
 * Descriptor of a code-bearing plugin loaded at runtime via Module Federation.
 * See ADR-013. The shell only loads it when integrity, signature and origin are
 * trusted; this contract carries the metadata required to make that decision.
 */
export interface AppPluginRemote {
  /** URL of the Native Federation `remoteEntry.json` manifest. Must be https://. */
  readonly url: string;
  /** Name of the standalone Angular module/component exposed by the remote. */
  readonly exposedModule: string;
  /** Subresource Integrity hash (e.g. `sha384-...`) of the remote entry manifest. */
  readonly integrity: string;
  /** Provenance signature as `keyId:base64`; the keyId must be trusted. */
  readonly signature: string;
  /** Framework dependencies the remote expects the shell to share as singletons. */
  readonly sharedDependencies?: readonly string[];
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
  readonly actions?: readonly AppActionContribution[];
  readonly i18nNamespaces?: readonly string[];
  readonly remote?: AppPluginRemote;
}
