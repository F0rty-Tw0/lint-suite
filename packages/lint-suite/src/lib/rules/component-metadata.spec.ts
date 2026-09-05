import assert from 'node:assert/strict';
import { join } from 'node:path';

import { test } from 'vitest';

import { componentMetadata, metadataTexts } from './component-metadata.ts';

const fixtureFile = (file: string): string => {
  return join(import.meta.dirname, 'common', 'fixtures', 'component-metadata', file);
};

const heroComponent = fixtureFile('hero.component.ts');
const bannerComponent = fixtureFile('banner.component.ts');
const plainComponent = fixtureFile('plain.component.ts');
const absentComponent = fixtureFile('absent.component.ts');

test('finds the metadata literal of a decorated component class', () => {
  const found = componentMetadata(heroComponent);

  assert.equal(found.length, 1);
});

test('reads no metadata from a file it cannot open', () => {
  assert.deepEqual(componentMetadata(absentComponent), []);
});

test('reads a string literal property as a single text', () => {
  const [metadata] = componentMetadata(heroComponent);

  assert.ok(metadata);
  assert.deepEqual(metadataTexts(metadata, 'templateUrl'), [
    './hero.component.html'
  ]);
});

test('reads an array literal property as every listed text', () => {
  const [metadata] = componentMetadata(heroComponent);

  assert.ok(metadata);
  assert.deepEqual(metadataTexts(metadata, 'styleUrls'), [
    './hero.component.scss',
    './hero.extra.scss'
  ]);
});

test('reads inline styles written as an array of literals', () => {
  const [metadata] = componentMetadata(heroComponent);

  assert.ok(metadata);
  assert.deepEqual(metadataTexts(metadata, 'styles'), ['.inline-one {}']);
});

test('reads a template literal without substitutions', () => {
  const [metadata] = componentMetadata(bannerComponent);

  assert.ok(metadata);
  const [style] = metadataTexts(metadata, 'styles');

  assert.ok(style?.includes('.only-inline'));
});

test('reads no text for a property the metadata does not declare', () => {
  const [metadata] = componentMetadata(plainComponent);

  assert.ok(metadata);
  assert.deepEqual(metadataTexts(metadata, 'styleUrl'), []);
});
