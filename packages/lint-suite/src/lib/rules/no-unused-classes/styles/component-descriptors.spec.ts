import assert from 'node:assert/strict';
import { join } from 'node:path';

import { test } from 'vitest';

import { componentDescriptors } from './component-descriptors.ts';

const fixtureFile = (file: string): string => {
  return join(import.meta.dirname, '..', '..', 'common', 'fixtures', 'component-metadata', file);
};

const heroComponent = fixtureFile('hero.component.ts');
const plainComponent = fixtureFile('plain.component.ts');
const absentComponent = fixtureFile('absent.component.ts');

test('reads templateUrl and styleUrls from a component that declares both', () => {
  const [descriptor] = componentDescriptors(heroComponent);

  assert.ok(descriptor);
  assert.deepEqual(descriptor, {
    templateUrl: './hero.component.html',
    template: null,
    styleUrls: ['./hero.component.scss', './hero.extra.scss']
  });
});

test('reads null template and no styleUrls when the component declares neither', () => {
  const [descriptor] = componentDescriptors(plainComponent);

  assert.ok(descriptor);
  assert.deepEqual(descriptor, {
    templateUrl: './plain.component.html',
    template: null,
    styleUrls: []
  });
});

test('reads no descriptors from a file it cannot open', () => {
  assert.deepEqual(componentDescriptors(absentComponent), []);
});

test('returns the same cached array instance for an unchanged file', () => {
  const first = componentDescriptors(heroComponent);
  const second = componentDescriptors(heroComponent);

  assert.equal(first, second);
});
