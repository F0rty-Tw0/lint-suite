import assert from 'node:assert/strict';

import { test } from 'vitest';

import { stylesheetTemplates } from './stylesheet-components.ts';
import { fixtureFile } from '../utils/fixture-stylesheet.spec.util.ts';

test('reads the templateUrl of the component that owns the stylesheet', () => {
  const stylesheet = fixtureFile('flat', 'card.component.scss');

  assert.deepEqual(stylesheetTemplates(stylesheet), [
    { kind: 'file', path: fixtureFile('flat', 'card.component.html') }
  ]);
});

test('reads the inline template of the owning component', () => {
  const stylesheet = fixtureFile('inline-template', 'banner.component.scss');
  const path = fixtureFile('inline-template', 'banner.component.ts');

  assert.deepEqual(stylesheetTemplates(stylesheet), [
    { kind: 'inline', source: '<div class="a"></div>', path }
  ]);
});

test('reads every component that declares the same stylesheet', () => {
  const stylesheet = fixtureFile('shared', 'shared.scss');

  assert.deepEqual(stylesheetTemplates(stylesheet), [
    { kind: 'file', path: fixtureFile('shared', 'left.component.html') },
    { kind: 'file', path: fixtureFile('shared', 'right.component.html') }
  ]);
});

test('falls back to the sibling template when no component matches', () => {
  const stylesheet = fixtureFile('sibling', 'note.component.scss');

  assert.deepEqual(stylesheetTemplates(stylesheet), [
    { kind: 'file', path: fixtureFile('sibling', 'note.component.html') }
  ]);
});

test('reads no template for a partial that no component declares', () => {
  const stylesheet = fixtureFile('partial', '_tokens.scss');

  assert.deepEqual(stylesheetTemplates(stylesheet), []);
});
