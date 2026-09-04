import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { FileEntry } from './common/project-index.type.ts';
import {
  dropEntriesMentioning,
  dropReplacedEntries,
  dropStaleTemplateEntries,
  indexableSourceFiles,
  sourceFileMaps
} from './project-index-staleness.ts';
import { fixtureProgram } from './utils/fixture-program.spec.util.ts';
import { emptyProjectIndex } from './utils/project-index.spec.util.ts';

const { program, sourceFile } = fixtureProgram('destructuring', 'sample.ts');

const entryFor = (source: FileEntry['sourceFile']): FileEntry => {
  const entry: FileEntry = {
    declarations: new Set(),
    dependencies: new Set(),
    fallbackNames: new Set(),
    sourceFile: source,
    templateVersions: [],
    usedDirectiveIndex: false
  };

  return entry;
};

test('indexes only project TypeScript sources', () => {
  const indexable = indexableSourceFiles(program);
  const maps = sourceFileMaps(program);

  assert.deepEqual(indexable, [sourceFile]);
  assert.deepEqual([...maps.current.keys()], [sourceFile.fileName]);
  assert.ok(maps.all.has(sourceFile.fileName));
});

test('keeps entries whose source and dependencies are unchanged', () => {
  const index = emptyProjectIndex();

  index.entries.set(sourceFile.fileName, entryFor(sourceFile));
  dropReplacedEntries(index, sourceFileMaps(program));

  assert.equal(index.entries.size, 1);
});

test('drops entries whose source file was replaced', () => {
  const index = emptyProjectIndex();
  const replaced = fixtureProgram('destructuring', 'sample.ts');

  index.entries.set(sourceFile.fileName, entryFor(replaced.sourceFile));
  dropReplacedEntries(index, sourceFileMaps(program));

  assert.equal(index.entries.size, 0);
});

test('drops entries whose text mentions a new candidate name', () => {
  const index = emptyProjectIndex();

  index.entries.set(sourceFile.fileName, entryFor(sourceFile));
  dropEntriesMentioning(index, new Set(['unrelatedName']));
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
