import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { test } from 'vitest';

import { stylesheetClasses } from './stylesheet-classes.ts';
import type { StylesheetSource } from '../common/no-unstyled-classes.type.ts';
import { fixtureFile } from '../test/utils/fixture-template.spec.util.ts';

const listStylesheet: StylesheetSource = {
  kind: 'file',
  path: fixtureFile('partials', 'list.component.scss')
};
const nestedStylesheet: StylesheetSource = {
  kind: 'file',
  path: fixtureFile('nested', 'panel.component.scss')
};
const absentStylesheet: StylesheetSource = {
  kind: 'file',
  path: fixtureFile('partials', 'absent.scss')
};
const brokenStylesheet: StylesheetSource = {
  kind: 'file',
  path: fixtureFile('invalid-scss', 'broken.component.scss')
};
const inlineStylesheet: StylesheetSource = {
  kind: 'inline',
  source: '.inline-one {}',
  path: fixtureFile('metadata', 'hero.component.ts')
};
const inlineImporter: StylesheetSource = {
  kind: 'inline',
  source: "@use './list.tokens';",
  path: fixtureFile('partials', 'list.component.ts')
};

test('reports no classes for an empty source list', () => {
  const classes = stylesheetClasses([]);

  assert.equal(classes.size, 0);
  assert.equal(classes.has('card'), false);
});

test('follows the partials a stylesheet uses and imports', () => {
  const classes = stylesheetClasses([listStylesheet]);

  assert.equal(classes.has('token-a'), true);
  assert.equal(classes.has('from-mixin-file'), true);
  assert.equal(classes.has('nope'), false);
});

test('matches a suffix pattern collected from a mixin body', () => {
  const classes = stylesheetClasses([listStylesheet]);

  assert.equal(classes.has('anything__item'), true);
});

test('lets a bare nesting selector in a partial match nothing extra', () => {
  const classes = stylesheetClasses([listStylesheet]);

  assert.equal(classes.has('from-mixin-child'), true);
  assert.equal(classes.has('totally-unrelated'), false);
});

test('resolves nested selectors of a component stylesheet', () => {
  const classes = stylesheetClasses([nestedStylesheet]);

  assert.equal(classes.has('panel__header--sticky'), true);
  assert.equal(classes.has('panel__body'), true);
  assert.equal(classes.has('b__x'), true);
});

test('collects the classes of an inline stylesheet source', () => {
  const classes = stylesheetClasses([inlineStylesheet]);

  assert.equal(classes.has('inline-one'), true);
});

test('resolves imports of an inline source against its own directory', () => {
  const classes = stylesheetClasses([inlineImporter]);

  assert.equal(classes.has('token-a'), true);
});

test('contributes nothing for a stylesheet that does not exist', () => {
  const classes = stylesheetClasses([absentStylesheet]);

  assert.equal(classes.size, 0);
});

test('contributes nothing for a stylesheet that fails to parse', () => {
  const classes = stylesheetClasses([brokenStylesheet]);

  assert.equal(classes.size, 0);
});

test('merges every source of the list', () => {
  const classes = stylesheetClasses([listStylesheet, inlineStylesheet]);

  assert.equal(classes.has('token-a'), true);
  assert.equal(classes.has('inline-one'), true);
});

test('reads the same file twice without changing the result', () => {
  const first = stylesheetClasses([listStylesheet]);
  const second = stylesheetClasses([listStylesheet]);

  assert.equal(first.size, second.size);
  assert.equal(second.has('token-a'), true);
});

test('sees a partial created after the stylesheet that uses it was read', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lint-suite-partials-'));
  const importer: StylesheetSource = {
    kind: 'file',
    path: join(directory, 'late.component.scss')
  };

  writeFileSync(importer.path, "@use './late.tokens';\n");

  const before = stylesheetClasses([importer]);

  writeFileSync(join(directory, '_late.tokens.scss'), '.late-token {}\n');

  const after = stylesheetClasses([importer]);

  rmSync(directory, { force: true, recursive: true });

  assert.equal(before.has('late-token'), false);
  assert.equal(after.has('late-token'), true);
});
