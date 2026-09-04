import assert from 'node:assert/strict';

import { test } from 'vitest';

import { reconcileClasses } from './project-index-classes.ts';
import { sourceFileMaps } from './project-index-staleness.ts';
import { fixtureProgram } from './utils/fixture-program.spec.util.ts';
import { emptyProjectIndex } from './utils/project-index.spec.util.ts';

const { program, checker, sourceFile } = fixtureProgram(
  'project-discovery',
  'chain.directive.ts'
);
const maps = sourceFileMaps(program);
const lazyChecker = (): typeof checker => checker;

test('indexes every current file and reports its member names as new', () => {
  const index = emptyProjectIndex();
  const newNames = reconcileClasses(index, maps, lazyChecker);

  assert.ok(index.classes.has(sourceFile.fileName));
  assert.ok(newNames.size > 0);
  assert.deepEqual([...index.candidateNames].sort(), [...newNames].sort());
});

test('reports nothing new when the same program is reconciled again', () => {
  const index = emptyProjectIndex();

  reconcileClasses(index, maps, lazyChecker);

  const classCount = index.classes.size;
  const shape = index.directiveShape;
  const newNames = reconcileClasses(index, maps, lazyChecker);

  assert.equal(newNames.size, 0);
  assert.equal(index.classes.size, classCount);
  assert.equal(index.directiveShape, shape);
});

test('re-indexes a file whose source object was replaced', () => {
  const index = emptyProjectIndex();
  const replaced = fixtureProgram('project-discovery', 'chain.directive.ts');

  reconcileClasses(
    index,
    sourceFileMaps(replaced.program),
    () => replaced.checker
  );

  const before = index.classes.get(sourceFile.fileName);

  reconcileClasses(index, maps, lazyChecker);

  const after = index.classes.get(sourceFile.fileName);

  assert.ok(before && after);
  assert.notEqual(before.sourceFile, after.sourceFile);
  assert.equal(after.sourceFile, sourceFile);
});
