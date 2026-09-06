import assert from 'node:assert/strict';

import { test } from 'vitest';

import { templateStylesheets } from './template-stylesheets.ts';
import {
  fixtureCase,
  fixtureDirectory,
  fixtureFile
} from '../utils/fixture-template.spec.util.ts';

const globalDirectory = fixtureDirectory('global');
const appTemplate = fixtureFile('global', 'app.component.html');
const plainTemplate = fixtureFile('no-stylesheet', 'plain.component.html');

test('knows the classes of the component stylesheet', () => {
  const lookup = templateStylesheets(appTemplate, '', globalDirectory, []);
  const classes = lookup();

  assert.equal(classes.has('local'), true);
  assert.equal(classes.has('global-one'), false);
});

test('merges global stylesheets resolved against the working directory', () => {
  const lookup = templateStylesheets(appTemplate, '', globalDirectory, [
    './styles.scss'
  ]);
  const classes = lookup();

  assert.equal(classes.has('local'), true);
  assert.equal(classes.has('global-one'), true);
});

test('ignores a global stylesheet that does not exist', () => {
  const lookup = templateStylesheets(appTemplate, '', globalDirectory, [
    './absent.scss'
  ]);
  const classes = lookup();

  assert.equal(classes.has('local'), true);
});

test('merges stylesheets linked from the template', () => {
  const { code, filename } = fixtureCase('linked', 'page.html');
  const lookup = templateStylesheets(filename, code, globalDirectory, []);
  const classes = lookup();

  assert.equal(classes.has('linked'), true);
  assert.equal(classes.has('nope'), false);
});

test('knows nothing when neither component nor global styles resolve', () => {
  const lookup = templateStylesheets(plainTemplate, '', globalDirectory, []);

  assert.equal(lookup().size, 0);
});

test('resolves the stylesheets once and reuses the result', () => {
  const lookup = templateStylesheets(appTemplate, '', globalDirectory, []);

  assert.equal(lookup(), lookup());
});
