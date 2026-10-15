import assert from 'node:assert/strict';

import { TSESTree } from '@typescript-eslint/utils';
import { describe, test } from 'vitest';

import { runtimeModuleSource } from './module-source.util.ts';
import type { ModuleSourceNode } from '../common/util-purity.type.ts';
import { parseProgram } from '../test/utils/parsed-program.spec.util.ts';

const { AST_NODE_TYPES } = TSESTree;

const MODULE_SOURCE_TYPES: ReadonlySet<string> = new Set([
  AST_NODE_TYPES.ImportDeclaration,
  AST_NODE_TYPES.ExportNamedDeclaration,
  AST_NODE_TYPES.ExportAllDeclaration,
  AST_NODE_TYPES.ImportExpression,
  AST_NODE_TYPES.TSImportEqualsDeclaration
]);

const isModuleSource = (node: TSESTree.Node): node is ModuleSourceNode =>
  MODULE_SOURCE_TYPES.has(node.type);

const unwrapStatement = (statement: TSESTree.Node): TSESTree.Node => {
  if (statement.type !== AST_NODE_TYPES.ExpressionStatement) return statement;

  return statement.expression;
};

const sourceOf = (code: string): string | undefined => {
  const program = parseProgram(code);
  const statement = program.body.at(0);

  assert.ok(statement);

  const node = unwrapStatement(statement);

  assert.ok(isModuleSource(node));

  const source = runtimeModuleSource(node);

  return source;
};

describe('FEATURE: runtimeModuleSource', () => {
  describe('GIVEN a value import', () => {
    test('WHEN it has named specifiers THEN returns its source', () => {
      const source = sourceOf(`import { readFileSync } from 'fs';`);

      assert.equal(source, 'fs');
    });

    test('WHEN it has no specifiers THEN returns its source', () => {
      const source = sourceOf(`import 'fs';`);

      assert.equal(source, 'fs');
    });

    test('WHEN a default sits next to a type specifier THEN returns its source', () => {
      const source = sourceOf(`import fs, { type A } from 'fs';`);

      assert.equal(source, 'fs');
    });

    test('WHEN it is a require import-equals THEN returns its source', () => {
      const source = sourceOf(`import fs = require('fs');`);

      assert.equal(source, 'fs');
    });

    test('WHEN it is dynamic THEN returns its source', () => {
      const source = sourceOf(`import('fs');`);

      assert.equal(source, 'fs');
    });
  });

  describe('GIVEN a value re-export', () => {
    test('WHEN it is a star re-export THEN returns its source', () => {
      const source = sourceOf(`export * from 'fs';`);

      assert.equal(source, 'fs');
    });

    test('WHEN value and type specifiers mix THEN returns its source', () => {
      const source = sourceOf(`export { type A, b } from 'fs';`);

      assert.equal(source, 'fs');
    });
  });

  describe('GIVEN a type-only import', () => {
    test('WHEN it uses import type THEN returns undefined', () => {
      const source = sourceOf(`import type { A } from 'fs';`);

      assert.equal(source, undefined);
    });

    test('WHEN every specifier is type-only THEN returns undefined', () => {
      const source = sourceOf(`import { type A } from 'fs';`);

      assert.equal(source, undefined);
    });

    test('WHEN it is a type require import-equals THEN returns undefined', () => {
      const source = sourceOf(`import type fs = require('fs');`);

      assert.equal(source, undefined);
    });
  });

  describe('GIVEN a type-only re-export', () => {
    test('WHEN it uses export type THEN returns undefined', () => {
      const source = sourceOf(`export type { A } from 'fs';`);

      assert.equal(source, undefined);
    });

    test('WHEN every specifier is type-only THEN returns undefined', () => {
      const source = sourceOf(`export { type A } from 'fs';`);

      assert.equal(source, undefined);
    });

    test('WHEN it is a type star re-export THEN returns undefined', () => {
      const source = sourceOf(`export type * from 'fs';`);

      assert.equal(source, undefined);
    });
  });

  describe('GIVEN no string literal source', () => {
    test('WHEN a dynamic import takes a variable THEN returns undefined', () => {
      const source = sourceOf(`import(name);`);

      assert.equal(source, undefined);
    });

    test('WHEN a dynamic import takes a number THEN returns undefined', () => {
      const source = sourceOf(`import(1);`);

      assert.equal(source, undefined);
    });

    test('WHEN an import-equals aliases a namespace THEN returns undefined', () => {
      const source = sourceOf(`import A = B.C;`);

      assert.equal(source, undefined);
    });

    test('WHEN an export declares a local THEN returns undefined', () => {
      const source = sourceOf(`export const a = 1;`);

      assert.equal(source, undefined);
    });
  });
});
