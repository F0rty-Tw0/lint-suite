import assert from 'node:assert/strict';
import { join } from 'node:path';

import { test } from 'vitest';

import { componentMetadata } from './component-metadata.ts';

const fixtureFile = (file: string): string => {
  return join(import.meta.dirname, 'test', 'fixtures', 'component-metadata', file);
};

const heroComponent = fixtureFile('hero.component.ts');
const bannerComponent = fixtureFile('banner.component.ts');
const plainComponent = fixtureFile('plain.component.ts');
const absentComponent = fixtureFile('absent.component.ts');

test('reads templateUrl, styleUrls, and styles of a decorated component', () => {
  const [descriptor] = componentMetadata(heroComponent);

  assert.deepEqual(descriptor, {
    templateUrl: './hero.component.html',
    template: null,
    styleUrls: ['./hero.component.scss', './hero.extra.scss'],
    styles: ['.inline-one {}']
  });
});

test('returns the same descriptors instance for an unchanged file', () => {
  const first = componentMetadata(heroComponent);
  const second = componentMetadata(heroComponent);

  assert.equal(first, second);
});

test('reads no metadata from a file it cannot open', () => {
  assert.deepEqual(componentMetadata(absentComponent), []);
});

test('reads a template literal style without substitutions', () => {
  const [descriptor] = componentMetadata(bannerComponent);

  assert.ok(descriptor);

  const [style] = descriptor.styles;

  assert.ok(style?.includes('.only-inline'));
});

test('reads null template and no styles when the metadata declares none', () => {
  const [descriptor] = componentMetadata(plainComponent);

  assert.deepEqual(descriptor, {
    templateUrl: './plain.component.html',
    template: null,
    styleUrls: [],
    styles: []
  });
});
