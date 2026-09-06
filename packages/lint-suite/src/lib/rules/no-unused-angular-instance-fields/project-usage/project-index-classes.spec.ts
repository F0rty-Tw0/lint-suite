import assert from 'node:assert/strict';

import { test } from 'vitest';

import { reconcileClasses } from './project-index-classes.ts';
import {
  currentSourceFiles,
  indexableSourceFiles
} from './project-index-staleness.ts';
import { fixtureProgram } from './utils/fixture-program.spec.util.ts';
import { emptyProjectIndex } from './utils/project-index.spec.util.ts';

const { program, checker, sourceFile } = fixtureProgram(
  'project-discovery',
  'chain.directive.ts'
);
const indexable = indexableSourceFiles(program);
const current = currentSourceFiles(program);
const lazyChecker = (): typeof checker => checker;

test('indexes every current file and reports its member names as new', () => {
  const index = emptyProjectIndex();
  const newNames = reconcileClasses(index, indexable, current, lazyChecker);

  assert.ok(index.classes.has(sourceFile.fileName));
  assert.ok(newNames.size > 0);

  const candidateNameArray = [...index.candidateNames];
  const newNameArray = [...newNames];

  assert.deepEqual(candidateNameArray.sort(), newNameArray.sort());
});

test('reports nothing new when the same program is reconciled again', () => {
  const index = emptyProjectIndex();

  reconcileClasses(index, indexable, current, lazyChecker);

  const classCount = index.classes.size;
  const shape = index.directiveShape;
  const directives = index.directives;
  const newNames = reconcileClasses(index, indexable, current, lazyChecker);

  assert.equal(newNames.size, 0);
  assert.equal(index.classes.size, classCount);
  assert.equal(index.directiveShape, shape);
  assert.equal(index.directives, directives);
});

test('re-indexes a file whose source object was replaced', () => {
  const index = emptyProjectIndex();
  const replaced = fixtureProgram('project-discovery', 'chain.directive.ts');

  reconcileClasses(
    index,
    indexableSourceFiles(replaced.program),
    currentSourceFiles(replaced.program),
    () => replaced.checker
  );

  const before = index.classes.get(sourceFile.fileName);
  const directives = index.directives;

  reconcileClasses(index, indexable, current, lazyChecker);

  const after = index.classes.get(sourceFile.fileName);

  assert.ok(before && after);
  assert.notEqual(before.sourceFile, after.sourceFile);
  assert.equal(after.sourceFile, sourceFile);
  assert.equal(after.shape, before.shape);
  assert.equal(index.directives, directives);

  const [replacedClass] = after.classes;

  assert.ok(replacedClass);
  assert.ok(index.directives.byDeclaration.has(replacedClass.declaration));
});
