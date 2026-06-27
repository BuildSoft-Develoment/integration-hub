#!/usr/bin/env node

/**
 * Operational tool to sign a plugin `remoteEntry` for ADR-013.
 *
 * Computes the SRI `integrity` of the remote entry and an ECDSA P-256 `signature`
 * over the canonical payload `id@version:integrity` (the exact contract verified
 * at load time by `AppPluginRemoteVerifier`). Also generates signing key pairs.
 *
 * Usage:
 *   node scripts/sign-plugin-remote.js genkey
 *   node scripts/sign-plugin-remote.js sign --id <id> --version <v> --url <url> \
 *     --exposedModule <name> --entry <remoteEntry.json> --keyId <id> --key <private.jwk>
 */

const fs = require('node:fs');
const { webcrypto } = require('node:crypto');

const ECDSA_PARAMS = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGN_PARAMS = { name: 'ECDSA', hash: { name: 'SHA-256' } };

function bytesToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

async function sriIntegrity(content) {
  const digest = await webcrypto.subtle.digest('SHA-384', Buffer.from(content, 'utf8'));
  return `sha384-${bytesToBase64(digest)}`;
}

/** Canonical payload the publisher signs. MUST match the runtime verifier. */
function canonicalPayload(id, version, integrity) {
  return `${id}@${version}:${integrity}`;
}

async function generateKeyPair() {
  const pair = await webcrypto.subtle.generateKey(ECDSA_PARAMS, true, ['sign', 'verify']);
  return {
    privateJwk: await webcrypto.subtle.exportKey('jwk', pair.privateKey),
    publicJwk: await webcrypto.subtle.exportKey('jwk', pair.publicKey),
  };
}

async function signRemote({ id, version, url, exposedModule, content, keyId, privateJwk }) {
  const integrity = await sriIntegrity(content);
  const key = await webcrypto.subtle.importKey('jwk', privateJwk, ECDSA_PARAMS, false, ['sign']);
  const payload = Buffer.from(canonicalPayload(id, version, integrity), 'utf8');
  const signatureBytes = await webcrypto.subtle.sign(SIGN_PARAMS, key, payload);

  return {
    url,
    exposedModule,
    integrity,
    signature: `${keyId}:${bytesToBase64(signatureBytes)}`,
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    if (key) {
      args[key] = argv[i + 1];
    }
  }
  return args;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);

  if (command === 'genkey') {
    const keys = await generateKeyPair();
    console.log(JSON.stringify(keys, null, 2));
    return;
  }

  if (command === 'sign') {
    const args = parseArgs(rest);
    for (const required of ['id', 'version', 'url', 'exposedModule', 'entry', 'keyId', 'key']) {
      if (!args[required]) {
        throw new Error(`Missing required --${required}`);
      }
    }
    const content = fs.readFileSync(args.entry, 'utf8');
    const privateJwk = JSON.parse(fs.readFileSync(args.key, 'utf8'));
    const remote = await signRemote({
      id: args.id,
      version: args.version,
      url: args.url,
      exposedModule: args.exposedModule,
      content,
      keyId: args.keyId,
      privateJwk,
    });
    console.log(JSON.stringify(remote, null, 2));
    return;
  }

  throw new Error(`Unknown command "${command ?? ''}". Use "genkey" or "sign".`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  bytesToBase64,
  sriIntegrity,
  canonicalPayload,
  generateKeyPair,
  signRemote,
};
