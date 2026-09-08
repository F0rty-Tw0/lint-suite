import assert from 'node:assert/strict';

import type { SourceFile } from 'typescript';
import { test } from 'vitest';

import { moduleEdges } from './module-edges.util.ts';
import type {
  FileEdges,
  ImportEdge
} from '../common/no-unused-exports.type.ts';
import {
  fixtureProgram,
  fixtureSourceFile
} from '../test/utils/fixture-program.spec.util.ts';

const FIXTURE = 'edge-cases';

const never = (): undefined => undefined;

const program = fixtureProgram(FIXTURE);
const checker = program.getTypeChecker();

const isExternal = (sourceFile: SourceFile): boolean => {
  return program.isSourceFileFromExternalLibrary(sourceFile);
};

const edgesOf = (file: string): FileEdges => {
  const sourceFile = fixtureSourceFile(program, FIXTURE, file);

  return moduleEdges(sourceFile, { checker, isExternal, onDisk: never });
};

const targetName = fixtureSourceFile(program, FIXTURE, 'target.ts').fileName;

test('collects exported declaration names', () => {
  const edges = edgesOf('target.ts');

  const declaredNames = [...edges.declared];

  assert.deepEqual(edges.exports, ['alpha', 'beta']);
  assert.deepEqual(declaredNames.sort(), ['alpha', 'beta']);
  assert.equal(edges.skipped, false);
});

test('records export default as the name default', () => {
  const edges = edgesOf('default-export.ts');

  assert.deepEqual(edges.exports, ['default']);
});

test('records a top-level dynamic import as a star import', () => {
  const edges = edgesOf('dynamic-import.ts');
  const expected: ImportEdge[] = [{ target: targetName, names: ['*'] }];

  assert.deepEqual(edges.imports, expected);
});

test('records a dynamic import nested in a callback as a star import', () => {
  const edges = edgesOf('lazy-route.ts');
  const expected: ImportEdge[] = [{ target: targetName, names: ['*'] }];

  assert.deepEqual(edges.imports, expected);
});

test('marks a file using export equals as skipped', () => {
  const edges = edgesOf('export-equals.ts');

  assert.equal(edges.skipped, true);
});

test('marks a file declaring an ambient module as skipped', () => {
  const edges = edgesOf('declared-module.ts');

  assert.equal(edges.skipped, true);
});

test('records a namespace import as a star import', () => {
  const edges = edgesOf('namespace-import.ts');
  const expected: ImportEdge[] = [{ target: targetName, names: ['*'] }];

  assert.deepEqual(edges.imports, expected);
  assert.deepEqual(edges.exports, ['namespaced']);
});

test('records a renamed local export and its import origin', () => {
  const edges = edgesOf('local-export.ts');
  const expected: ImportEdge[] = [{ target: targetName, names: ['beta'] }];

  assert.deepEqual(edges.imports, expected);
  assert.deepEqual(edges.exports, ['exportedName']);
  assert.deepEqual(edges.reExports, []);
});

test('lists a literal import that resolves nowhere as dangling', () => {
  const edges = edgesOf('dangling-import.ts');

  assert.deepEqual(edges.imports, []);
  assert.deepEqual(edges.dangling, ['./gone']);
});
