const assert = require('node:assert/strict');
const test = require('node:test');
const { webcrypto } = require('node:crypto');

const {
  sriIntegrity,
  canonicalPayload,
  generateKeyPair,
  signRemote,
} = require('./sign-plugin-remote');

const ECDSA_PARAMS = { name: 'ECDSA', namedCurve: 'P-256' };
const VERIFY_PARAMS = { name: 'ECDSA', hash: { name: 'SHA-256' } };

const SAMPLE = { id: 'demo', version: '1.0.0', url: 'https://plugins.example.com/remoteEntry.json', exposedModule: './Widget' };
const CONTENT = JSON.stringify({ name: 'demo', exposes: { './Widget': './widget.js' } });

async function verify(publicJwk, payload, signatureBytes) {
  const key = await webcrypto.subtle.importKey('jwk', publicJwk, ECDSA_PARAMS, false, ['verify']);
  return webcrypto.subtle.verify(VERIFY_PARAMS, key, signatureBytes, Buffer.from(payload, 'utf8'));
}

test('produces a well-formed SRI integrity and keyId:base64 signature', async () => {
  const { privateJwk } = await generateKeyPair();
  const remote = await signRemote({ ...SAMPLE, content: CONTENT, keyId: 'key-1', privateJwk });

  assert.equal(remote.integrity, await sriIntegrity(CONTENT));
  assert.match(remote.integrity, /^sha384-[A-Za-z0-9+/]{16,}={0,2}$/);
  assert.match(remote.signature, /^key-1:[A-Za-z0-9+/]{8,}={0,2}$/);
});

test('signature verifies against the public key over the canonical payload', async () => {
  const { privateJwk, publicJwk } = await generateKeyPair();
  const remote = await signRemote({ ...SAMPLE, content: CONTENT, keyId: 'key-1', privateJwk });

  const signatureBytes = Buffer.from(remote.signature.split(':')[1], 'base64');
  const payload = canonicalPayload(SAMPLE.id, SAMPLE.version, remote.integrity);

  assert.equal(await verify(publicJwk, payload, signatureBytes), true);
});

test('signature does not verify when the payload (version) is tampered', async () => {
  const { privateJwk, publicJwk } = await generateKeyPair();
  const remote = await signRemote({ ...SAMPLE, content: CONTENT, keyId: 'key-1', privateJwk });

  const signatureBytes = Buffer.from(remote.signature.split(':')[1], 'base64');
  const tampered = canonicalPayload(SAMPLE.id, '2.0.0', remote.integrity);

  assert.equal(await verify(publicJwk, tampered, signatureBytes), false);
});
