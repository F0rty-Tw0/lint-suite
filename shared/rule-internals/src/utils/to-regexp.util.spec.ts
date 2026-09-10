import assert from 'node:assert/strict';

import { test } from 'vitest';

import { toRegExp } from './to-regexp.util.ts';

test('compiles a pattern source with the unicode flag', () => {
  const pattern = toRegExp('^is[A-Z]');

  assert.equal(pattern.flags, 'u');
  assert.ok(pattern.test('isReady'));
  assert.ok(!pattern.test('ready'));
});
