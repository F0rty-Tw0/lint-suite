import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  recordField,
  stringArrayField,
  stringField
} from './manifest-fields.util.ts';

const MANIFEST = {
  name: 'a',
  empty: '',
  tags: ['x', 'y'],
  mixed: ['x', 1],
  nx: { name: 'b' },
  list: []
};

test('stringField reads non-empty strings only', (): void => {
  assert.equal(stringField(MANIFEST, 'name'), 'a');
  assert.equal(stringField(MANIFEST, 'empty'), undefined);
  assert.equal(stringField(undefined, 'name'), undefined);
});

test('stringArrayField drops arrays holding non-strings', (): void => {
  assert.deepEqual(stringArrayField(MANIFEST, 'tags'), ['x', 'y']);
  assert.deepEqual(stringArrayField(MANIFEST, 'mixed'), []);
});

test('recordField reads plain objects, not arrays', (): void => {
  const nx = { name: 'b' };

  assert.deepEqual(recordField(MANIFEST, 'nx'), nx);
  assert.equal(recordField(MANIFEST, 'list'), undefined);
});
