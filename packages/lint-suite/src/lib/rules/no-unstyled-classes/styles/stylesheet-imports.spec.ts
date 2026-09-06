import assert from 'node:assert/strict';
import { join } from 'node:path';

import { test } from 'vitest';

import { resolveStylesheetImport } from './stylesheet-imports.ts';
import { fixtureDirectory } from '../test/utils/fixture-template.spec.util.ts';

const partials = fixtureDirectory('partials');

test('resolves a relative specifier to its underscore partial', () => {
  const resolved = resolveStylesheetImport("'./list.tokens'", partials);

  assert.equal(resolved, join(partials, '_list.tokens.scss'));
});

test('resolves a nested specifier that already names the partial', () => {
  const resolved = resolveStylesheetImport("'shared/_mixins'", partials);

  assert.equal(resolved, join(partials, 'shared', '_mixins.scss'));
});

test('reads the specifier out of double quotes', () => {
  const resolved = resolveStylesheetImport(
    '"./list.tokens" as tokens',
    partials
  );

  assert.equal(resolved, join(partials, '_list.tokens.scss'));
});

test('skips a built-in sass module', () => {
  assert.equal(resolveStylesheetImport("'sass:math'", partials), null);
});

test('skips a remote stylesheet', () => {
  const params = "'https://example.test/a'";

  assert.equal(resolveStylesheetImport(params, partials), null);
});

test('skips a plain css import that the browser resolves', () => {
  assert.equal(resolveStylesheetImport("'theme.css'", partials), null);
});

test('skips params that hold no quoted specifier', () => {
  assert.equal(resolveStylesheetImport('url(theme)', partials), null);
});

test('skips a specifier that resolves to no file on disk', () => {
  assert.equal(resolveStylesheetImport("'./absent'", partials), null);
});
