import assert from 'node:assert/strict';

import { test } from 'vitest';

import { templateUsage } from './template-usage.ts';
import type { TemplateSource } from '../common/no-unused-classes.type.ts';
import { fixtureFile } from '../test/utils/fixture-stylesheet.spec.util.ts';

const fileSource = (name: string, file: string): TemplateSource => {
  const source: TemplateSource = {
    kind: 'file',
    path: fixtureFile(name, file)
  };

  return source;
};

test('collects the static classes of a template file', () => {
  const usage = templateUsage([fileSource('flat', 'card.component.html')]);

  assert.equal(usage.isDynamic, false);
  assert.equal(usage.size, 2);
  assert.equal(usage.has('card'), true);
  assert.equal(usage.has('card__title'), true);
  assert.equal(usage.has('unused'), false);
});

test('collects the classes of every template of the stylesheet', () => {
  const usage = templateUsage([
    fileSource('shared', 'left.component.html'),
    fileSource('shared', 'right.component.html')
  ]);

  assert.equal(usage.has('left'), true);
  assert.equal(usage.has('right'), true);
  assert.equal(usage.has('nope'), false);
});

test('collects the classes of an inline template', () => {
  const path = fixtureFile('inline-template', 'banner.component.ts');
  const source: TemplateSource = {
    kind: 'inline',
    source: '<div class="a"></div>',
    path
  };
  const usage = templateUsage([source]);

  assert.equal(usage.has('a'), true);
  assert.equal(usage.has('b'), false);
});

test('matches an interpolated class token as a pattern', () => {
  const usage = templateUsage([
    fileSource('interpolation', 'badge.component.html')
  ]);

  assert.equal(usage.isDynamic, false);
  assert.equal(usage.has('badge'), true);
  assert.equal(usage.has('badge--lg'), true);
  assert.equal(usage.has('other'), false);
});

test('reads a class binding whose expression cannot be resolved', () => {
  const usage = templateUsage([fileSource('dynamic', 'grid.component.html')]);

  assert.equal(usage.isDynamic, true);
  assert.equal(usage.has('nope'), false);
});

test('reads a component whose template is unknown as dynamic', () => {
  const source: TemplateSource = { kind: 'unknown' };

  assert.equal(templateUsage([source]).isDynamic, true);
});

test('reads a template file that cannot be read as dynamic', () => {
  const usage = templateUsage([fileSource('flat', 'absent.component.html')]);

  assert.equal(usage.isDynamic, true);
});
