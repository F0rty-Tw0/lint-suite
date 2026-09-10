import assert from 'node:assert/strict';

import {
  ScriptTarget,
  createSourceFile,
  isExportDeclaration
} from 'typescript';
import type { ExportDeclaration } from 'typescript';
import { test } from 'vitest';

import { addExportFrom, addLocalExport } from './export-edges.util.ts';
import type {
  EdgeAccumulator,
  ModuleResolver
} from '../common/no-unused-exports.type.ts';

const exportDeclarationOf = (code: string): ExportDeclaration => {
  const sourceFile = createSourceFile('sample.ts', code, ScriptTarget.Latest);
  const statement = sourceFile.statements.find(isExportDeclaration);

  assert.ok(statement, 'sample must contain an export declaration');

  return statement;
};

const emptyEdges = (): EdgeAccumulator => {
  const edges: EdgeAccumulator = {
    exports: [],
    declared: new Set(),
    imports: [],
    reExports: [],
    starTargets: [],
    dangling: []
  };

  return edges;
};

const resolveTo = (target: string | undefined): ModuleResolver => {
  return () => target;
};

test('records a re-exported name and its origin', () => {
  const statement = exportDeclarationOf(
    "export { origin as renamed } from './mod';"
  );
  const edges = emptyEdges();

  addExportFrom(statement, edges, resolveTo('target.ts'));

  assert.deepEqual(edges.exports, ['renamed']);
  assert.deepEqual(edges.reExports, [
    { target: 'target.ts', source: 'origin', exported: 'renamed' }
  ]);
});

test('skips the re-export edge when the target cannot be resolved', () => {
  const statement = exportDeclarationOf("export { a } from './mod';");
  const edges = emptyEdges();

  addExportFrom(statement, edges, resolveTo(undefined));

  assert.deepEqual(edges.exports, ['a']);
  assert.deepEqual(edges.reExports, []);
});

test('records a star re-export as a star target', () => {
  const statement = exportDeclarationOf("export * from './mod';");
  const edges = emptyEdges();

  addExportFrom(statement, edges, resolveTo('target.ts'));

  assert.deepEqual(edges.starTargets, ['target.ts']);
});

test('ignores an unresolved star re-export', () => {
  const statement = exportDeclarationOf("export * from './mod';");
  const edges = emptyEdges();

  addExportFrom(statement, edges, resolveTo(undefined));

  assert.deepEqual(edges.starTargets, []);
});

test('records a namespace re-export as both an export and a star import', () => {
  const statement = exportDeclarationOf("export * as ns from './mod';");
  const edges = emptyEdges();

  addExportFrom(statement, edges, resolveTo('target.ts'));

  assert.deepEqual(edges.exports, ['ns']);
  assert.equal(edges.declared.has('ns'), true);
  assert.deepEqual(edges.imports, [{ target: 'target.ts', names: ['*'] }]);
});

test('records a local export list without a module specifier', () => {
  const statement = exportDeclarationOf(
    'const a = 1;\nconst b = 2;\nexport { a, b };'
  );
  const edges = emptyEdges();

  addLocalExport(statement, edges);

  const declaredNames = [...edges.declared];

  assert.deepEqual(edges.exports, ['a', 'b']);
  assert.deepEqual(declaredNames.sort(), ['a', 'b']);
});
