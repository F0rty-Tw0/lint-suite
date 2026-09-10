import assert from 'node:assert/strict';
import { join } from 'node:path';

import { test } from 'vitest';

import {
  importSpecifier,
  resolveStylesheetImport
} from './stylesheet-imports.ts';
import { fixtureDirectory } from '../test/utils/fixture-template.spec.util.ts';

const partials = fixtureDirectory('partials');

test('reads the specifier out of single quotes', () => {
  assert.equal(importSpecifier("'./list.tokens'"), './list.tokens');
});

test('reads the specifier out of double quotes', () => {
  assert.equal(importSpecifier('"./list.tokens" as tokens'), './list.tokens');
});

test('skips a built-in sass module', () => {
  assert.equal(importSpecifier("'sass:math'"), null);
});

test('skips a remote stylesheet', () => {
  assert.equal(importSpecifier("'https://example.test/a'"), null);
});

test('skips a plain css import that the browser resolves', () => {
  assert.equal(importSpecifier("'theme.css'"), null);
});

test('skips params that hold no quoted specifier', () => {
  assert.equal(importSpecifier('url(theme)'), null);
});

test('resolves a relative specifier to its underscore partial', () => {
  const resolved = resolveStylesheetImport('./list.tokens', partials);

  assert.equal(resolved, join(partials, '_list.tokens.scss'));
});

test('resolves a nested specifier that already names the partial', () => {
  const resolved = resolveStylesheetImport('shared/_mixins', partials);

  assert.equal(resolved, join(partials, 'shared', '_mixins.scss'));
});

test('resolves to null when no candidate exists on disk', () => {
  assert.equal(resolveStylesheetImport('./absent', partials), null);
});
