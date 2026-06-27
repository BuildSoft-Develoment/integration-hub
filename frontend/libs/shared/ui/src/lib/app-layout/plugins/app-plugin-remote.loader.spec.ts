import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppPluginManifest } from '../navigation/app-navigation.models';
import { provideAppPluginManifests } from './app-plugin.token';
import {
  AppPluginRemoteLoader,
  provideAppPluginRemoteModuleLoader,
  RemoteModuleLoader,
} from './app-plugin-remote.loader';
import {
  AppPluginRemoteVerificationResult,
  AppPluginRemoteVerifier,
} from './app-plugin-remote.verifier';
import { AppPluginRuntimeRegistry } from './app-plugin-runtime.registry';

describe('AppPluginRemoteLoader', () => {
  function configure(
    verification: AppPluginRemoteVerificationResult,
    moduleLoader: RemoteModuleLoader | null,
    extraProviders: Provider[] = []
  ) {
    const verifier: Partial<AppPluginRemoteVerifier> = {
      verify: () => Promise.resolve(verification),
    };

    TestBed.configureTestingModule({
      providers: [
        ...provideAppPluginManifests([platformManifest()]),
        { provide: AppPluginRemoteVerifier, useValue: verifier },
        ...(moduleLoader ? [provideAppPluginRemoteModuleLoader(moduleLoader)] : []),
        ...extraProviders,
      ],
    });

    return {
      loader: TestBed.inject(AppPluginRemoteLoader),
      registry: TestBed.inject(AppPluginRuntimeRegistry),
    };
  }

  it('returns null without degrading when the manifest declares no remote', async () => {
    const { loader, registry } = configure({ ok: true }, () => Promise.resolve({}));

    const result = await loader.load({
      id: 'plain',
      version: '1.0.0',
      platformVersion: '1.0.0',
      displayName: 'Plain',
    });

    expect(result).toBeNull();
    expect(registry.degraded()).toEqual([]);
  });

  it('verifies and mounts a remote module on success', async () => {
    const module = { Widget: class {} };
    const { loader, registry } = configure({ ok: true }, () => Promise.resolve(module));

    const result = await loader.load(remoteManifest());

    expect(result).toBe(module);
    expect(registry.degraded()).toEqual([]);
  });

  it('degrades and skips loading when verification fails', async () => {
    const moduleLoader = vi.fn<RemoteModuleLoader>(() => Promise.resolve({}));
    const { loader, registry } = configure(
      { ok: false, reason: 'invalid-signature' },
      moduleLoader
    );

    const result = await loader.load(remoteManifest());

    expect(result).toBeNull();
    expect(moduleLoader).not.toHaveBeenCalled();
    expect(registry.degraded()[0]).toEqual({
      id: 'remote-x',
      reason: 'verification failed: invalid-signature',
    });
  });

  it('degrades when the module loader throws', async () => {
    const { loader, registry } = configure({ ok: true }, () =>
      Promise.reject(new Error('boom'))
    );

    const result = await loader.load(remoteManifest());

    expect(result).toBeNull();
    expect(registry.degraded()[0].id).toBe('remote-x');
    expect(registry.degraded()[0].reason).toMatch(/load failed: boom/);
  });

  it('degrades when no remote module loader is configured', async () => {
    const { loader, registry } = configure({ ok: true }, null);

    const result = await loader.load(remoteManifest());

    expect(result).toBeNull();
    expect(registry.degraded()[0].reason).toMatch(/no remote module loader/);
  });
});

function platformManifest(): AppPluginManifest {
  return {
    id: 'platform',
    version: '1.0.0',
    platformVersion: '1.0.0',
    displayName: 'Platform',
  };
}

function remoteManifest(): AppPluginManifest {
  return {
    id: 'remote-x',
    version: '1.0.0',
    platformVersion: '1.0.0',
    displayName: 'Remote X',
    remote: {
      url: 'https://plugins.example.com/remoteEntry.json',
      exposedModule: './Widget',
      integrity: `sha384-${'A'.repeat(64)}`,
      signature: `key-1:${'A'.repeat(43)}=`,
    },
  };
}
