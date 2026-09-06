import assert from 'node:assert/strict';

import { test } from 'vitest';

import { linkedStylesheets } from './linked-stylesheets.ts';
import {
  fixtureCase,
  fixtureFile
} from '../utils/fixture-template.spec.util.ts';

const page = fixtureCase('linked', 'page.html');

test('resolves stylesheet links against the template directory', () => {
  const sources = linkedStylesheets(page.code, page.filename);

  assert.deepEqual(sources, [
    { kind: 'file', path: fixtureFile('linked', 'theme.css') }
  ]);
});

test('skips a linked stylesheet that does not exist', () => {
  const template = '<link rel="stylesheet" href="absent.css">';

  assert.deepEqual(linkedStylesheets(template, page.filename), []);
});
