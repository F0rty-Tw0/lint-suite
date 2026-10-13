import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  hasTag,
  mapGlobToRegExp,
  matchImportWithWildcard
} from './tag-patterns.util.ts';

test('mapGlobToRegExp bans nested subpaths of a scope', (): void => {
  assert.ok(mapGlobToRegExp('@nestjs/*').test('@nestjs/common/testing'));
});

test('mapGlobToRegExp anchors both ends', (): void => {
  const regex = mapGlobToRegExp('lodash');

  assert.ok(regex.test('lodash'));
  assert.ok(!regex.test('lodash-es'));
  assert.ok(!regex.test('my-lodash'));
});

test('mapGlobToRegExp treats .* in the input as a wildcard', (): void => {
  assert.equal(mapGlobToRegExp('a.*b').source, '^a.*b$');
  assert.ok(mapGlobToRegExp('a.*b').test('a/x/b'));
});

test('mapGlobToRegExp keeps unescaped regex characters', (): void => {
  assert.ok(mapGlobToRegExp('a.b').test('axb'));
});

test('mapGlobToRegExp memoizes compiled patterns', (): void => {
  assert.equal(mapGlobToRegExp('@scope/**'), mapGlobToRegExp('@scope/**'));
});

test('hasTag: * matches an untagged project', (): void => {
  assert.ok(hasTag([], '*'));
});

test('hasTag: /regex/ form', (): void => {
  assert.ok(hasTag(['scope:web'], '/^scope/'));
  assert.ok(!hasTag(['type:ui'], '/^scope/'));
});

test('hasTag: /regex/ form never matches an untagged project', (): void => {
  assert.ok(!hasTag([], '/.*/'));
});

test('hasTag: a lone / is the regex / like Nx substring(1, 0)', (): void => {
  assert.ok(hasTag(['a/b'], '/'));
  assert.ok(!hasTag(['scope:web'], '/'));
});

test('hasTag: no * means exact equality', (): void => {
  assert.ok(!hasTag(['scope:web'], 'scope'));
  assert.ok(hasTag(['scope:web'], 'scope:web'));
});

test('hasTag: * glob like scope:* matches by prefix', (): void => {
  assert.ok(hasTag(['type:ui', 'scope:web'], 'scope:*'));
  assert.ok(!hasTag(['type:ui'], 'scope:*'));
  assert.ok(!hasTag([], 'scope:*'));
});

test('matchImportWithWildcard accepts this repo allow regex', (): void => {
  assert.ok(
    matchImportWithWildcard(
      '^.*/eslint\\.config(\\.base)?\\.[cm]?[jt]s$',
      '../../eslint.config.base.ts'
    )
  );
});

test('matchImportWithWildcard /* allows one more segment only', (): void => {
  assert.ok(matchImportWithWildcard('@a/b/*', '@a/b/c'));
  assert.ok(!matchImportWithWildcard('@a/b/*', '@a/b/c/d'));
});

test('matchImportWithWildcard /** is a prefix match', (): void => {
  assert.ok(matchImportWithWildcard('@a/b/**', '@a/b/c/d'));
  assert.ok(matchImportWithWildcard('@a/b/**', '@a/b/'));
  assert.ok(!matchImportWithWildcard('@a/b/**', '@a/bc'));
});

test('matchImportWithWildcard inner /**/ is prefix plus suffix', (): void => {
  assert.ok(matchImportWithWildcard('@a/**/testing', '@a/b/c/testing'));
  assert.ok(!matchImportWithWildcard('@a/**/testing', '@a/b/c/core'));
  assert.ok(!matchImportWithWildcard('@a/**/testing', '@x/b/testing'));
});

test('matchImportWithWildcard falls back to an unanchored regex', (): void => {
  assert.ok(matchImportWithWildcard('lodash', 'lodash-es'));
  assert.ok(!matchImportWithWildcard('^lodash$', 'lodash-es'));
});
