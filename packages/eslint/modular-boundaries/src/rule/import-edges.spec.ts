import assert from 'node:assert/strict';

import { programOf } from '@lint-suite/rule-test-support/utils/parsed-program.spec.util.ts';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { test } from 'vitest';

import { importEdgeListeners } from './import-edges.ts';

type Collector = {
  readonly listeners: TSESLint.RuleListener;
  readonly specifiers: string[];
};

const collector = (): Collector => {
  const specifiers: string[] = [];
  const listeners = importEdgeListeners((_node, specifier) => {
    specifiers.push(specifier);
  });
  const collected: Collector = { listeners, specifiers };

  return collected;
};

const firstStatement = (code: string): TSESTree.ProgramStatement => {
  const program = programOf(code);
  const [statement] = program.body;

  assert.ok(statement);

  return statement;
};

const firstExpression = (code: string): TSESTree.Expression => {
  const statement = firstStatement(code);

  assert.ok(statement.type === AST_NODE_TYPES.ExpressionStatement);

  return statement.expression;
};

test('an import declaration visits its source specifier', (): void => {
  const { listeners, specifiers } = collector();
  const statement = firstStatement("import x from 'a';");

  assert.ok(statement.type === AST_NODE_TYPES.ImportDeclaration);
  listeners.ImportDeclaration?.(statement);
  assert.deepEqual(specifiers, ['a']);
});

test('an export without a source visits nothing', (): void => {
  const { listeners, specifiers } = collector();
  const statement = firstStatement('export const x = 1;');

  assert.ok(statement.type === AST_NODE_TYPES.ExportNamedDeclaration);
  listeners.ExportNamedDeclaration?.(statement);
  assert.deepEqual(specifiers, []);
});

test('require visits a plain template literal specifier', (): void => {
  const { listeners, specifiers } = collector();
  const expression = firstExpression('require(`b`);');

  assert.ok(expression.type === AST_NODE_TYPES.CallExpression);
  listeners.CallExpression?.(expression);
  assert.deepEqual(specifiers, ['b']);
});

test('require skips a template literal with expressions', (): void => {
  const { listeners, specifiers } = collector();
  const expression = firstExpression('require(`${name}`);');

  assert.ok(expression.type === AST_NODE_TYPES.CallExpression);
  listeners.CallExpression?.(expression);
  assert.deepEqual(specifiers, []);
});

test('a call to another function visits nothing', (): void => {
  const { listeners, specifiers } = collector();
  const expression = firstExpression("load('c');");

  assert.ok(expression.type === AST_NODE_TYPES.CallExpression);
  listeners.CallExpression?.(expression);
  assert.deepEqual(specifiers, []);
});
