import { TestBed } from '@angular/core/testing';

import {
  APP_PLUGIN_CRYPTO,
  APP_PLUGIN_REMOTE_FETCH,
  AppPluginRemoteVerifier,
  canonicalRemotePayload,
  provideAppPluginRemoteKeys,
} from './app-plugin-remote.verifier';

describe('AppPluginRemoteVerifier', () => {
  const manifest = { id: 'demo', version: '1.0.0' };

  let cryptoApi: Crypto;
  let publicJwk: JsonWebKey;
  let manifestText: string;
  let integrity: string;
  let signature: string;
  let wrongSignature: string;

  beforeAll(async () => {
    cryptoApi = await resolveCrypto();
    const keyPair = await cryptoApi.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );
    publicJwk = await cryptoApi.subtle.exportKey('jwk', keyPair.publicKey);

    manifestText = JSON.stringify({ name: 'demo', exposes: { './Widget': './widget.js' } });
    const digest = await cryptoApi.subtle.digest(
      'SHA-384',
      asBuffer(new TextEncoder().encode(manifestText))
    );
    integrity = `sha384-${bytesToBase64(new Uint8Array(digest))}`;

    signature = `key-1:${await sign(cryptoApi, keyPair.privateKey, payloadFor('1.0.0', integrity))}`;
    // Valid signature, but bound to a different version -> must not verify for 1.0.0.
    wrongSignature = `key-1:${await sign(cryptoApi, keyPair.privateKey, payloadFor('2.0.0', integrity))}`;
  });

  function configure(
    fetchText: string = manifestText,
    keys: Record<string, JsonWebKey> = { 'key-1': publicJwk }
  ): AppPluginRemoteVerifier {
    TestBed.configureTestingModule({
      providers: [
        provideAppPluginRemoteKeys(keys),
        { provide: APP_PLUGIN_CRYPTO, useValue: cryptoApi },
        { provide: APP_PLUGIN_REMOTE_FETCH, useValue: stubFetch(fetchText) },
      ],
    });
    return TestBed.inject(AppPluginRemoteVerifier);
  }

  it('verifies a remote with matching integrity and a trusted signature', async () => {
    const verifier = configure();
    const result = await verifier.verify(manifest, remote(integrity, signature));
    expect(result.ok).toBe(true);
  });

  it('fails when the fetched content does not match the integrity hash', async () => {
    const verifier = configure('tampered remote entry');
    const result = await verifier.verify(manifest, remote(integrity, signature));
    expect(result).toEqual({ ok: false, reason: 'integrity-mismatch' });
  });

  it('fails when the signing key is not trusted', async () => {
    const verifier = configure(manifestText, {});
    const result = await verifier.verify(manifest, remote(integrity, signature));
    expect(result.reason).toBe('untrusted-key');
  });

  it('fails when the signature does not match the canonical payload', async () => {
    const verifier = configure();
    const result = await verifier.verify(manifest, remote(integrity, wrongSignature));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('invalid-signature');
  });

  function payloadFor(version: string, integrityValue: string): string {
    return canonicalRemotePayload(
      { id: 'demo', version },
      remote(integrityValue, '')
    );
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

async function sign(
  cryptoApi: Crypto,
  privateKey: CryptoKey,
  payload: string
): Promise<string> {
  const buffer = await cryptoApi.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    asBuffer(new TextEncoder().encode(payload))
  );
  return bytesToBase64(new Uint8Array(buffer));
}

function stubFetch(text: string): typeof fetch {
  return (() =>
    Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(text),
    })) as unknown as typeof fetch;
}

async function resolveCrypto(): Promise<Crypto> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto subtle is not available in the test environment');
  }
  return globalThis.crypto;
}

function asBuffer(bytes: Uint8Array): BufferSource {
  return bytes as unknown as BufferSource;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
