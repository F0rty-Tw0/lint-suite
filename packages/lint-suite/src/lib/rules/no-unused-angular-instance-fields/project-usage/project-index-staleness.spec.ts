import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { FileEntry } from './common/project-index.type.ts';
import {
  addEntry,
  currentSourceFiles,
  dropEntriesMentioning,
  dropReplacedEntries,
  dropStaleTemplateEntries,
  indexableSourceFiles,
  removeEntry
} from './project-index-staleness.ts';
import { fixtureProgram } from './utils/fixture-program.spec.util.ts';
import { emptyProjectIndex } from './utils/project-index.spec.util.ts';

const { program, sourceFile } = fixtureProgram('destructuring', 'sample.ts');

const entryFor = (
  source: FileEntry['sourceFile'],
  overrides: Partial<FileEntry> = {}
): FileEntry => {
  const entry: FileEntry = {
    declarations: new Set(),
    dependencies: new Set(),
    fallbackNames: new Set(),
    mentionedNames: new Set(),
    sourceFile: source,
    templateVersions: [],
    usedDirectiveIndex: false,
    ...overrides
  };

  return entry;
};

test('indexes only project TypeScript sources', () => {
  assert.deepEqual(indexableSourceFiles(program), [sourceFile]);
});

test('counts declarations and fallback names as entries come and go', () => {
  const index = emptyProjectIndex();
  const declarations = new Set([sourceFile]);
  const fallbackNames = new Set(['label']);

  addEntry(index, entryFor(sourceFile, { declarations, fallbackNames }));
  assert.equal(index.declarationCounts.get(sourceFile), 1);
  assert.equal(index.fallbackNameCounts.get('label'), 1);

  removeEntry(index, sourceFile.fileName);
  assert.equal(index.entries.size, 0);
  assert.equal(index.declarationCounts.size, 0);
  assert.equal(index.fallbackNameCounts.size, 0);
});

test('keeps entries whose source and dependencies are unchanged', () => {
  const index = emptyProjectIndex();

  addEntry(index, entryFor(sourceFile));
  dropReplacedEntries(index, currentSourceFiles(program));

  assert.equal(index.entries.size, 1);
});

test('drops entries whose source file was replaced', () => {
  const index = emptyProjectIndex();
  const replaced = fixtureProgram('destructuring', 'sample.ts');

  addEntry(index, entryFor(replaced.sourceFile));
  dropReplacedEntries(index, currentSourceFiles(program));

  assert.equal(index.entries.size, 0);
});

test('drops entries that mention a new candidate name by exact name', () => {
  const index = emptyProjectIndex();
  const mentionedNames = new Set(['label']);

  addEntry(index, entryFor(sourceFile, { mentionedNames }));
  dropEntriesMentioning(index, new Set(['unrelatedName']));
  assert.equal(index.entries.size, 1);

  dropEntriesMentioning(index, new Set(['labelled']));
  assert.equal(index.entries.size, 1);

  dropEntriesMentioning(index, new Set(['label']));
  assert.equal(index.entries.size, 0);
});

test('throttles template checks by the duration of the last check', () => {
  const index = emptyProjectIndex();

  index.templateCheckedAt = performance.now();
  index.templateCheckDuration = 1_000;
  dropStaleTemplateEntries(index, false);
  assert.equal(index.templateCheckDuration, 1_000);

  dropStaleTemplateEntries(index, true);
  assert.notEqual(index.templateCheckDuration, 1_000);
});
