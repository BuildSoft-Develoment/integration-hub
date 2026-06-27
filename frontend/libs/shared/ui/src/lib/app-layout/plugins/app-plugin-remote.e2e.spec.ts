import { TestBed } from '@angular/core/testing';

import { AppPluginManifest } from '../navigation/app-navigation.models';
import { provideAppPluginManifests } from './app-plugin.token';
import {
  AppPluginRemoteLoader,
  provideAppPluginRemoteModuleLoader,
} from './app-plugin-remote.loader';
import {
  APP_PLUGIN_CRYPTO,
  APP_PLUGIN_REMOTE_FETCH,
  canonicalRemotePayload,
  provideAppPluginRemoteKeys,
} from './app-plugin-remote.verifier';
import { AppPluginRuntimeRegistry } from './app-plugin-runtime.registry';

/**
 * End-to-end of the ADR-013 governance chain (headless): a remote signed exactly
 * like the publisher tool flows through the real loader + real verifier + registry.
 */
describe('Plugin remote governance chain (e2e)', () => {
  const manifest = { id: 'demo', version: '1.0.0' };
  const content = JSON.stringify({ name: 'demo', exposes: { './Widget': './widget.js' } });

  let cryptoApi: Crypto;
  let publicJwk: JsonWebKey;
  let integrity: string;
  let signature: string;

  beforeAll(async () => {
    cryptoApi = globalThis.crypto;
    const pair = await cryptoApi.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );
    publicJwk = await cryptoApi.subtle.exportKey('jwk', pair.publicKey);

    const digest = await cryptoApi.subtle.digest('SHA-384', encode(content));
    integrity = `sha384-${base64(digest)}`;

    const payload = canonicalRemotePayload(manifest, remote(integrity, ''));
    const sig = await cryptoApi.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      pair.privateKey,
      encode(payload)
    );
    signature = `key-1:${base64(sig)}`;
  });

  function configure(fetchContent: string) {
    TestBed.configureTestingModule({
      providers: [
        ...provideAppPluginManifests([platformManifest()]),
        provideAppPluginRemoteKeys({ 'key-1': publicJwk }),
        { provide: APP_PLUGIN_CRYPTO, useValue: cryptoApi },
        { provide: APP_PLUGIN_REMOTE_FETCH, useValue: stubFetch(fetchContent) },
        provideAppPluginRemoteModuleLoader(() => Promise.resolve({ Widget: class {} })),
      ],
    });
    return {
      loader: TestBed.inject(AppPluginRemoteLoader),
      registry: TestBed.inject(AppPluginRuntimeRegistry),
    };
  }

  it('verifies a correctly signed remote and mounts its module', async () => {
    const { loader, registry } = configure(content);

    const module = await loader.load(remoteManifest(integrity, signature));

    expect(module).not.toBeNull();
    expect(registry.degraded()).toEqual([]);
  });

  it('degrades when the fetched content does not match the signed integrity', async () => {
    const { loader, registry } = configure('tampered remote entry');

    const module = await loader.load(remoteManifest(integrity, signature));

    expect(module).toBeNull();
    expect(registry.degraded()[0].reason).toMatch(/integrity-mismatch/);
  });

  function remoteManifest(integrityValue: string, signatureValue: string): AppPluginManifest {
    return {
      id: 'demo',
      version: '1.0.0',
      platformVersion: '1.0.0',
      displayName: 'Demo Remote',
      remote: remote(integrityValue, signatureValue),
    };
  }
});

function remote(integrity: string, signature: string) {
  return {
    url: 'https://plugins.example.com/remoteEntry.json',
    exposedModule: './Widget',
    integrity,
    signature,
  };
}

function platformManifest(): AppPluginManifest {
  return { id: 'platform', version: '1.0.0', platformVersion: '1.0.0', displayName: 'Platform' };
}

function stubFetch(text: string): typeof fetch {
  return (() =>
    Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(text) })) as unknown as typeof fetch;
}

function encode(value: string): BufferSource {
  return new TextEncoder().encode(value) as unknown as BufferSource;
}

function base64(buffer: ArrayBuffer): string {
  let binary = '';
  for (const byte of new Uint8Array(buffer)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
