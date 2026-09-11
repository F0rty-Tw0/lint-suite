import assert from 'node:assert/strict';

import { parse } from 'postcss-scss';
import { test } from 'vitest';

import { collectStylesheet } from './stylesheet-collection.ts';
import type { StylesheetEntry } from '../common/no-unstyled-classes.type.ts';

const collect = (source: string): StylesheetEntry => {
  return collectStylesheet(parse(source));
};

test('collects the classes of top level rules', () => {
  const entry = collect('.card {} .is-active {}');

  assert.deepEqual(entry.classes, ['card', 'is-active']);
});

test('resolves nested selectors against their parent', () => {
  const entry = collect('.panel { &__header { &--sticky {} } .inner {} }');

  assert.deepEqual(entry.classes, [
    'panel',
    'panel__header',
    'panel__header--sticky',
    'panel',
    'inner'
  ]);
});

test('keeps the parent of rules nested inside a media query', () => {
  const entry = collect('.panel { @media (min-width: 1px) { &__body {} } }');

  assert.deepEqual(entry.classes, ['panel', 'panel__body']);
});

test('expands a selector list into one parent per member', () => {
  const entry = collect('.a, .b { &__x {} }');

  assert.deepEqual(entry.classes, ['a', 'b', 'a__x', 'b__x']);
});

test('turns a mixin body without a parent into a suffix pattern', () => {
  const entry = collect('@mixin item { &__item {} }');

  assert.deepEqual(entry.classes, []);
  assert.deepEqual(entry.patterns, ['^.*__item$']);
});

test('collects no pattern for a bare nesting selector in a mixin', () => {
  const entry = collect('@mixin hover { &:hover {} & .child {} }');

  assert.deepEqual(entry.classes, ['child']);
  assert.deepEqual(entry.patterns, []);
});

test('records the specifiers of use, import, and forward', () => {
  const source = "@use './list.tokens'; @import 'shared/_mixins';";
  const entry = collect(source);

  assert.deepEqual(entry.imports, ['./list.tokens', 'shared/_mixins']);
});

test('records no specifier for an import that names no file', () => {
  const entry = collect("@use 'sass:math';");

  assert.deepEqual(entry.imports, []);
});

test('collects an interpolated selector as a pattern', () => {
  const entry = collect('.icon-#{$size} {}');

  assert.deepEqual(entry.classes, []);
  assert.deepEqual(entry.patterns, ['^icon-.*$']);
});
