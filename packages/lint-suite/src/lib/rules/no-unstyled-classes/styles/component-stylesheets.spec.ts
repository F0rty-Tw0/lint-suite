import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  componentStylesheets,
  stylesheetFiles
} from './component-stylesheets.ts';
import {
  fixtureDirectory,
  fixtureFile
} from '../utils/fixture-template.spec.util.ts';

test('reads styleUrls declared by the component metadata', () => {
  const sources = componentStylesheets(
    fixtureFile('metadata', 'hero.component.html')
  );
  const paths = sources.map((source) => source.path);

  assert.deepEqual(paths, [
    fixtureFile('metadata', 'hero.component.scss'),
    fixtureFile('metadata', 'hero.extra.scss'),
    fixtureFile('metadata', 'hero.component.ts')
  ]);
});

test('reads a single styleUrl declared by the component metadata', () => {
  const sources = componentStylesheets(
    fixtureFile('flat', 'card.component.html')
  );

  assert.deepEqual(sources, [
    { kind: 'file', path: fixtureFile('flat', 'card.component.scss') }
  ]);
});

test('reads inline styles as a source anchored at the component file', () => {
  const sources = componentStylesheets(
    fixtureFile('inline-styles-only', 'banner.component.html')
  );
  const componentPath = fixtureFile(
    'inline-styles-only',
    'banner.component.ts'
  );
  const kinds = sources.map((source) => source.kind);
  const paths = sources.map((source) => source.path);

  assert.deepEqual(kinds, ['inline']);
  assert.deepEqual(paths, [componentPath]);
});

test('reads no source for a component that declares no styles', () => {
  const template = fixtureFile('no-stylesheet', 'plain.component.html');

  assert.deepEqual(componentStylesheets(template), []);
});

test('falls back to the sibling stylesheet when metadata declares none', () => {
  const template = fixtureFile('sibling-fallback', 'note.component.html');

  assert.deepEqual(componentStylesheets(template), [
    {
      kind: 'file',
      path: fixtureFile('sibling-fallback', 'note.component.scss')
    }
  ]);
});

test('keeps only the declared paths that exist on disk', () => {
  const directory = fixtureDirectory('global');
  const paths = ['./styles.scss', './absent.scss'];

  assert.deepEqual(stylesheetFiles(paths, directory), [
    { kind: 'file', path: fixtureFile('global', 'styles.scss') }
  ]);
});
