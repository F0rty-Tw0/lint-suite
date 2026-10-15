import assert from 'node:assert/strict';

import { test } from 'vitest';

import { extractSpecifiers } from './specifiers.util.ts';

test('extractSpecifiers returns require and dynamic import specifiers', (): void => {
  const specifiers = extractSpecifiers("require('a'); import('b');");

  assert.deepEqual(specifiers.toSorted(), ['a', 'b']);
});

test('extractSpecifiers returns static import, type import and re-export specifiers', (): void => {
  const lines = [
    "import x from 'a';",
    "import type { T } from 'b';",
    "export * from 'c';"
  ];
  const text = lines.join('\n');
  const specifiers = extractSpecifiers(text);

  assert.deepEqual(specifiers.toSorted(), ['a', 'b', 'c']);
});

test('extractSpecifiers returns nothing for a file without imports', (): void => {
  assert.deepEqual(extractSpecifiers('export const x = 1;'), []);
});
