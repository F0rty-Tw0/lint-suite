import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  classMatcher,
  resolveSelectors,
  selectorClasses,
  selectorTemplateClasses
} from './selector-classes.ts';

test('keeps selectors unchanged when there is no parent', () => {
  assert.deepEqual(resolveSelectors(['.a', '.b'], []), ['.a', '.b']);
});

test('turns a parentless nesting selector into an unknown parent class', () => {
  assert.deepEqual(resolveSelectors(['&__item'], []), ['.zzparentzz__item']);
});

test('turns a parentless suffix into a pattern anchored on the suffix', () => {
  const classes = selectorClasses('.zzparentzz__item');

  assert.deepEqual(classes.exact, []);
  assert.deepEqual(classes.patterns, ['^.*__item$']);
});

test('collects nothing for a parentless bare nesting selector', () => {
  const classes = selectorClasses('.zzparentzz:hover');

  assert.deepEqual(classes.exact, []);
  assert.deepEqual(classes.patterns, []);
});

test('collects only the descendant of a parentless bare nesting rule', () => {
  const classes = selectorClasses('.zzparentzz .x');

  assert.deepEqual(classes.exact, ['x']);
  assert.deepEqual(classes.patterns, []);
});

test('keeps a lone interpolated class as an honest wildcard', () => {
  const classes = selectorClasses('.#{$name}');

  assert.deepEqual(classes.patterns, ['^.*$']);
});

test('replaces every nesting marker with the parent selector', () => {
  const selectors = ['&__el', '&--mod', '&.other', '&:hover', '& > .x', '&-s'];
  const resolved = resolveSelectors(selectors, ['.panel']);

  assert.deepEqual(resolved, [
    '.panel__el',
    '.panel--mod',
    '.panel.other',
    '.panel:hover',
    '.panel > .x',
    '.panel-s'
  ]);
});

test('replaces a trailing nesting marker in place', () => {
  assert.deepEqual(resolveSelectors(['.wrapper &'], ['.panel']), [
    '.wrapper .panel'
  ]);
});

test('descends a selector without a nesting marker', () => {
  assert.deepEqual(resolveSelectors(['.inner'], ['.panel']), ['.panel .inner']);
});

test('expands every parent of a selector list', () => {
  assert.deepEqual(resolveSelectors(['&__x'], ['.a', '.b']), [
    '.a__x',
    '.b__x'
  ]);
});

test('collects plain class names of a selector', () => {
  const classes = selectorClasses('.panel.is-open > .inner');

  assert.deepEqual(classes.exact, ['panel', 'is-open', 'inner']);
  assert.deepEqual(classes.patterns, []);
});

test('collects classes written inside functional pseudo-classes', () => {
  const classes = selectorClasses(':host(.a) :not(.b) ::ng-deep .c');

  assert.deepEqual(classes.exact, ['a', 'b', 'c']);
});

test('turns an interpolated class into an anchored pattern', () => {
  const classes = selectorClasses('.icon-#{$size}');

  assert.deepEqual(classes.exact, []);
  assert.deepEqual(classes.patterns, ['^icon-.*$']);
});

test('escapes regular expression metacharacters of literal parts', () => {
  const classes = selectorClasses('.a.b\\.c#{$x}');

  assert.deepEqual(classes.patterns, ['^b\\.c.*$']);
});

test('reports no classes for a selector it cannot parse', () => {
  const classes = selectorClasses('.a[');

  assert.deepEqual(classes.exact, []);
  assert.deepEqual(classes.patterns, []);
});

test('matches a name held by the exact set', () => {
  const matches = classMatcher(new Set(['card']), []);

  assert.equal(matches('card'), true);
  assert.equal(matches('other'), false);
});

test('matches a name accepted by one of the patterns', () => {
  const matches = classMatcher(new Set<string>(), [/^icon-.*$/u]);

  assert.equal(matches('icon-lg'), true);
  assert.equal(matches('icon'), false);
});

test('reads the class of an already resolved nested selector', () => {
  assert.deepEqual(selectorTemplateClasses('.panel__header'), [
    'panel__header'
  ]);
});

test('skips the arguments of a host pseudo-class', () => {
  assert.deepEqual(selectorTemplateClasses(':host(.dark) .title'), ['title']);
});

test('skips the arguments of a host-context pseudo-class', () => {
  const names = selectorTemplateClasses(':host-context(.rtl) .body');

  assert.deepEqual(names, ['body']);
});

test('stops collecting at a piercing pseudo-element', () => {
  assert.deepEqual(selectorTemplateClasses('.a ::ng-deep .b'), ['a']);
});

test('stops collecting at a piercing combinator', () => {
  assert.deepEqual(selectorTemplateClasses('.a /deep/ .b'), ['a']);
  assert.deepEqual(selectorTemplateClasses('.a >>> .b'), ['a']);
});

test('reads the classes written inside a plain pseudo-class', () => {
  assert.deepEqual(selectorTemplateClasses(':not(.x)'), ['x']);
  assert.deepEqual(selectorTemplateClasses(':is(.p, .q)'), ['p', 'q']);
});

test('skips an interpolated class name', () => {
  assert.deepEqual(selectorTemplateClasses('.icon-#{$s}'), []);
});

test('skips a class name holding an unresolved parent', () => {
  assert.deepEqual(selectorTemplateClasses('.zzparentzz__item .x'), ['x']);
});

test('reads every class of a selector list once', () => {
  assert.deepEqual(selectorTemplateClasses('.a .b, .a .c'), ['a', 'b', 'c']);
});

test('reads no template class from a selector it cannot parse', () => {
  assert.deepEqual(selectorTemplateClasses('.a['), []);
});
