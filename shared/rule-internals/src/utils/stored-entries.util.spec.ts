import assert from 'node:assert/strict';

import { test } from 'vitest';

import { storedEntries } from './stored-entries.util.ts';

test('keeps entries that carry a string version and a value', () => {
  const entry = { version: 'v1', value: 1 };
  const text = JSON.stringify({ '/a.ts': entry });
  const entries = storedEntries<number>(text);
  const expected = [['/a.ts', entry]];

  assert.deepEqual([...entries], expected);
});

test('drops entries without a string version or without a value', () => {
  const noVersion = { value: 1 };
  const numericVersion = { version: 1, value: 1 };
  const noValue = { version: 'v1' };
  const stored = {
    '/no-version.ts': noVersion,
    '/numeric-version.ts': numericVersion,
    '/no-value.ts': noValue,
    '/null.ts': null
  };
  const entries = storedEntries<number>(JSON.stringify(stored));

  assert.equal(entries.size, 0);
});

test('returns no entries when the stored JSON is not an object', () => {
  assert.equal(storedEntries('null').size, 0);
  assert.equal(storedEntries('"text"').size, 0);
});

test('throws on text that is not JSON', () => {
  assert.throws(() => storedEntries('{'), SyntaxError);
});
