import { inject, Injectable, InjectionToken, Provider } from '@angular/core';

import { AppPluginManifest, AppPluginRemote } from '../navigation/app-navigation.models';

export type AppPluginRemoteVerificationReason =
  | 'fetch-failed'
  | 'integrity-mismatch'
  | 'untrusted-key'
  | 'invalid-signature'
  | 'malformed';

export interface AppPluginRemoteVerificationResult {
  readonly ok: boolean;
  readonly reason?: AppPluginRemoteVerificationReason;
  readonly detail?: string;
}

/** Public keys (JWK, ECDSA P-256) trusted to sign plugin remotes, keyed by keyId. */
export const APP_PLUGIN_REMOTE_KEYS = new InjectionToken<Record<string, JsonWebKey>>(
  'APP_PLUGIN_REMOTE_KEYS'
);

export function provideAppPluginRemoteKeys(keys: Record<string, JsonWebKey>): Provider {
  return { provide: APP_PLUGIN_REMOTE_KEYS, useValue: keys };
}

/** Test/SSR seam for the fetch used to download the remote entry manifest. */
export const APP_PLUGIN_REMOTE_FETCH = new InjectionToken<typeof fetch>(
  'APP_PLUGIN_REMOTE_FETCH'
);

/** Test/SSR seam for the Web Crypto implementation used for verification. */
export const APP_PLUGIN_CRYPTO = new InjectionToken<Crypto>('APP_PLUGIN_CRYPTO');

const SRI_ALGORITHMS: Record<string, string> = {
  sha256: 'SHA-256',
  sha384: 'SHA-384',
  sha512: 'SHA-512',
};

/**
 * Canonical payload signed by the publisher: binds the signer's attestation to a
 * specific plugin identity and content hash, preventing signature reuse across
 * plugins or versions.
 */
export function canonicalRemotePayload(
  manifest: Pick<AppPluginManifest, 'id' | 'version'>,
  remote: AppPluginRemote
): string {
  return `${manifest.id}@${manifest.version}:${remote.integrity}`;
}

/**
 * Load-time cryptographic verification of a plugin remote (see ADR-013). Complements
 * the synchronous metadata gate: here the real bytes are checked. The remote entry is
 * downloaded, its SRI `integrity` is recomputed and compared, and the `signature` is
 * verified (ECDSA P-256) against the trusted public key for its `keyId`.
 */
@Injectable({ providedIn: 'root' })
export class AppPluginRemoteVerifier {
  private readonly keys = inject(APP_PLUGIN_REMOTE_KEYS, { optional: true }) ?? {};
  private readonly fetchFn =
    inject(APP_PLUGIN_REMOTE_FETCH, { optional: true }) ??
    (globalThis.fetch ? globalThis.fetch.bind(globalThis) : undefined);
  private readonly cryptoApi = inject(APP_PLUGIN_CRYPTO, { optional: true }) ?? globalThis.crypto;

  async verify(
    manifest: Pick<AppPluginManifest, 'id' | 'version'>,
    remote: AppPluginRemote
  ): Promise<AppPluginRemoteVerificationResult> {
    const integrity = parseIntegrity(remote.integrity);
    const signature = parseSignature(remote.signature);
    if (!integrity || !signature) {
      return { ok: false, reason: 'malformed' };
    }

    const jwk = this.keys[signature.keyId];
    if (!jwk) {
      return { ok: false, reason: 'untrusted-key', detail: signature.keyId };
    }

    let body: string;
    try {
      const response = await this.fetchFn?.(remote.url, { cache: 'no-store' });
      if (!response || !response.ok) {
        return { ok: false, reason: 'fetch-failed', detail: `HTTP ${response?.status ?? 'error'}` };
      }
      body = await response.text();
    } catch (error) {
      return { ok: false, reason: 'fetch-failed', detail: errorText(error) };
    }

    const bodyBytes = new TextEncoder().encode(body);

    const digest = await this.cryptoApi.subtle.digest(integrity.algorithm, asBuffer(bodyBytes));
    if (bytesToBase64(new Uint8Array(digest)) !== integrity.hash) {
      return { ok: false, reason: 'integrity-mismatch' };
    }

    try {
      const key = await this.cryptoApi.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify']
      );
      const payload = new TextEncoder().encode(canonicalRemotePayload(manifest, remote));
      const verified = await this.cryptoApi.subtle.verify(
        { name: 'ECDSA', hash: { name: 'SHA-256' } },
        key,
        asBuffer(signature.bytes),
        asBuffer(payload)
      );
      return verified ? { ok: true } : { ok: false, reason: 'invalid-signature' };
    } catch (error) {
      return { ok: false, reason: 'invalid-signature', detail: errorText(error) };
    }
  }
}

function parseIntegrity(value: string): { algorithm: string; hash: string } | null {
  const match = /^(sha256|sha384|sha512)-([A-Za-z0-9+/]{16,}={0,2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  return { algorithm: SRI_ALGORITHMS[match[1]], hash: match[2] };
}

function parseSignature(value: string): { keyId: string; bytes: Uint8Array } | null {
  const match = /^([A-Za-z0-9._-]+):([A-Za-z0-9+/]{8,}={0,2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  return { keyId: match[1], bytes: base64ToBytes(match[2]) };
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

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
