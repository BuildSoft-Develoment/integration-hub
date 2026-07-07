#!/usr/bin/env node
// Author tooling: compute the SRI integrity and ECDSA P-256 signature that
// manifest.json's `remote` block must carry (see ADR-013). The host verifies both
// before mounting the remote code, so these values pin the exact bytes you publish.
//
// Usage:
//   node sign-remote.mjs <path-to-remoteEntry.json> <keyId> [privateKeyPem]
//
// If no private key is given, a fresh P-256 keypair is generated and printed; register
// the PUBLIC key with the host (its `keyId` must be in APP_PLUGIN_REMOTE_TRUSTED_KEYS)
// and keep the private key secret.

import { readFile } from 'node:fs/promises';
import { createHash, webcrypto } from 'node:crypto';

async function main() {
  const [remotePath, keyId, privateKeyPem] = process.argv.slice(2);
  if (!remotePath || !keyId) {
    console.error('Usage: node sign-remote.mjs <remoteEntry.json> <keyId> [privateKeyPem]');
    process.exit(1);
  }

  const bytes = await readFile(remotePath);

  // SRI integrity (sha384) — this is manifest.remote.integrity.
  const integrity = `sha384-${createHash('sha384').update(bytes).digest('base64')}`;

  // Load or generate the signing key.
  let privateKey;
  if (privateKeyPem) {
    privateKey = await webcrypto.subtle.importKey(
      'pkcs8',
      pemToDer(await readFile(privateKeyPem, 'utf8')),
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
  } else {
    const pair = await webcrypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );
    privateKey = pair.privateKey;
    const spki = Buffer.from(await webcrypto.subtle.exportKey('spki', pair.publicKey));
    console.log('# Generated public key (register this with the host, keyId=' + keyId + '):');
    console.log(derToPem(spki, 'PUBLIC KEY'));
  }

  const signature = Buffer.from(
    await webcrypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, bytes)
  ).toString('base64');

  console.log('\n# Paste these into manifest.json -> remote:');
  console.log(JSON.stringify({ integrity, signature: `${keyId}:${signature}` }, null, 2));
}

function pemToDer(pem) {
  return Buffer.from(pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, ''), 'base64');
}

function derToPem(der, label) {
  const b64 = der.toString('base64').replace(/(.{64})/g, '$1\n');
  return `-----BEGIN ${label}-----\n${b64}\n-----END ${label}-----`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
