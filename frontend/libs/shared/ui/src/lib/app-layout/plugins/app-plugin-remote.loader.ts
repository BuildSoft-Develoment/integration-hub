import { inject, Injectable, InjectionToken, Provider } from '@angular/core';

import { AppPluginManifest } from '../navigation/app-navigation.models';
import { AppPluginRemoteVerifier } from './app-plugin-remote.verifier';
import { AppPluginRuntimeRegistry } from './app-plugin-runtime.registry';

export interface RemoteModuleRequest {
  readonly remoteEntry: string;
  readonly exposedModule: string;
}

/**
 * Bundler-specific function that resolves a remote module. The host wires the
 * Native Federation `loadRemoteModule` here, keeping `shared/ui` agnostic of the
 * build tooling. See ADR-013.
 */
export type RemoteModuleLoader = (request: RemoteModuleRequest) => Promise<unknown>;

export const REMOTE_MODULE_LOADER = new InjectionToken<RemoteModuleLoader>(
  'REMOTE_MODULE_LOADER'
);

export function provideAppPluginRemoteModuleLoader(loader: RemoteModuleLoader): Provider {
  return { provide: REMOTE_MODULE_LOADER, useValue: loader };
}

/**
 * Loads a plugin's remote code under the ADR-013 governance: the remote is first
 * cryptographically verified, then mounted through the host-provided loader inside
 * an error boundary. Any failure marks the plugin `degraded` in the runtime registry
 * and returns `null`; it never throws, so a faulty plugin cannot break the shell.
 */
@Injectable({ providedIn: 'root' })
export class AppPluginRemoteLoader {
  private readonly verifier = inject(AppPluginRemoteVerifier);
  private readonly registry = inject(AppPluginRuntimeRegistry);
  private readonly loader = inject(REMOTE_MODULE_LOADER, { optional: true });

  async load(manifest: AppPluginManifest): Promise<unknown | null> {
    const remote = manifest.remote;
    if (!remote) {
      return null;
    }

    if (!this.loader) {
      this.registry.markDegraded(manifest.id, 'no remote module loader is configured');
      return null;
    }

    const verification = await this.verifier.verify(manifest, remote);
    if (!verification.ok) {
      this.registry.markDegraded(
        manifest.id,
        `verification failed: ${verification.reason ?? 'unknown'}`
      );
      return null;
    }

    try {
      return await this.loader({
        remoteEntry: remote.url,
        exposedModule: remote.exposedModule,
      });
    } catch (error) {
      this.registry.markDegraded(manifest.id, `load failed: ${errorText(error)}`);
      return null;
    }
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
