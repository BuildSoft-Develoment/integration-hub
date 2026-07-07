import test from 'node:test';
import assert from 'node:assert/strict';
import { transform } from '../src/transform.js';

test('upper transforms and reports engine', () => {
  const o = transform({ text: 'hola mundo', op: 'upper' });
  assert.equal(o.success, true);
  assert.equal(o.outputs.result, 'HOLA MUNDO');
  assert.equal(o.outputs.engine, 'node');
  assert.equal(o.outputs.op, 'upper');
});

test('reverse transforms', () => {
  const o = transform({ text: 'abc', op: 'reverse' });
  assert.equal(o.success, true);
  assert.equal(o.outputs.result, 'cba');
});

test('missing op defaults to identity', () => {
  const o = transform({ text: 'abc' });
  assert.equal(o.success, true);
  assert.equal(o.outputs.result, 'abc');
  assert.equal(o.outputs.op, 'identity');
});

test('missing text fails loud', () => {
  const o = transform({ op: 'upper' });
  assert.equal(o.success, false);
});

test('unknown op fails loud', () => {
  const o = transform({ text: 'abc', op: 'explode' });
  assert.equal(o.success, false);
});
