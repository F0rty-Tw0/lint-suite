import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  compiledPatterns,
  globRegExpIn,
  importMatcher,
  mapGlobToRegExp,
  tagMatcher,
  tagMatcherIn
} from './tag-patterns.util.ts';
import { constraintStub } from '../test/utils/check-edge.spec.util.ts';

const hasTag = (tags: string[], pattern: string): boolean => {
  const matches = tagMatcher(pattern);

  return matches(tags);
};

const matchImport = (pattern: string, specifier: string): boolean => {
  const matches = importMatcher(pattern);

  return matches(specifier);
};

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

test('mapGlobToRegExp compiles a pattern to the same matches each time', (): void => {
  const first = mapGlobToRegExp('@scope/**');
  const second = mapGlobToRegExp('@scope/**');

  assert.equal(first.source, second.source);
  assert.ok(first.test('@scope/a/b') && second.test('@scope/a/b'));
  assert.ok(!first.test('@other/a') && !second.test('@other/a'));
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

test('importMatcher accepts this repo allow regex', (): void => {
  assert.ok(
    matchImport(
      '^.*/eslint\\.config(\\.base)?\\.[cm]?[jt]s$',
      '../../eslint.config.base.ts'
    )
  );
});

test('importMatcher /* allows one more segment only', (): void => {
  assert.ok(matchImport('@a/b/*', '@a/b/c'));
  assert.ok(!matchImport('@a/b/*', '@a/b/c/d'));
});

test('importMatcher /** is a prefix match', (): void => {
  assert.ok(matchImport('@a/b/**', '@a/b/c/d'));
  assert.ok(matchImport('@a/b/**', '@a/b/'));
  assert.ok(!matchImport('@a/b/**', '@a/bc'));
});

test('importMatcher inner /**/ is prefix plus suffix', (): void => {
  assert.ok(matchImport('@a/**/testing', '@a/b/c/testing'));
  assert.ok(!matchImport('@a/**/testing', '@a/b/c/core'));
  assert.ok(!matchImport('@a/**/testing', '@x/b/testing'));
});

test('importMatcher falls back to an unanchored regex', (): void => {
  assert.ok(matchImport('lodash', 'lodash-es'));
  assert.ok(!matchImport('^lodash$', 'lodash-es'));
});

test('compiledPatterns keys every tag and external pattern', (): void => {
  const match = { anyOf: ['scope:*'], allOf: ['type:ui'] };
  const constraint = constraintStub({
    match,
    onlyTags: ['/^lib/'],
    notTags: ['legacy'],
    allowedExternal: ['lodash*'],
    bannedExternal: ['@nestjs/*']
  });
  const patterns = compiledPatterns([constraint]);
  const tagKeys = Array.from(patterns.tags.keys());
  const globKeys = Array.from(patterns.globs.keys());

  assert.deepEqual(tagKeys, ['scope:*', 'type:ui', '/^lib/', 'legacy']);
  assert.deepEqual(globKeys, ['lodash*', '@nestjs/*']);
});

test('compiled lookups match like freshly compiled patterns', (): void => {
  const constraint = constraintStub({ onlyTags: ['scope:*'] });
  const patterns = compiledPatterns([constraint]);
  const compiled = tagMatcherIn(patterns, 'scope:*');
  const uncompiled = tagMatcherIn(patterns, 'type:*');

  assert.ok(compiled(['scope:web']) && !compiled(['type:ui']));
  assert.ok(uncompiled(['type:ui']) && !uncompiled(['scope:web']));
  assert.ok(globRegExpIn(patterns, 'lodash*').test('lodash-es'));
});
