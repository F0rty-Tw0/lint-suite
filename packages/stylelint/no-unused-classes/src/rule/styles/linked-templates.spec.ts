import assert from 'node:assert/strict';
import { join } from 'node:path';

import { test } from 'vitest';

import { linkedTemplates, templateLinks } from './linked-templates.ts';
import {
  fixtureFile,
  useFixtureWorkingDirectory
} from '../test/utils/fixture-stylesheet.spec.util.ts';

useFixtureWorkingDirectory();

const template = fixtureFile('linked-elsewhere', join('pages', 'index.html'));
const stylesheet = fixtureFile('linked-elsewhere', join('styles', 'theme.css'));

test('reads the relative stylesheet links of a template', () => {
  assert.deepEqual(templateLinks(template), ['../styles/theme.css']);
});

test('reads no links from a template that cannot be opened', () => {
  assert.deepEqual(
    templateLinks(fixtureFile('linked-elsewhere', 'absent.html')),
    []
  );
});

test('finds every template under the working directory that links a stylesheet', () => {
  assert.deepEqual(linkedTemplates(stylesheet), [template]);
});

test('finds no template for a stylesheet nothing links', () => {
  assert.deepEqual(linkedTemplates(fixtureFile('partial', '_tokens.scss')), []);
});
