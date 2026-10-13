import assert from 'node:assert/strict';

import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';
import tseslint from 'typescript-eslint';

import { isProgram } from '@lint-suite/rule-test-support/utils/parsed-program.spec.util.ts';

type ParsedCondition = {
  readonly condition: TSESTree.Expression;
  readonly scope: TSESLint.Scope.Scope;
};

const isScopeManager = (
  value: unknown
): value is TSESLint.Scope.ScopeManager => {
  const isObject = typeof value === 'object' && value !== null;

  if (!isObject) return false;

  if (!('scopes' in value)) return false;

  return 'globalScope' in value;
};

export const parseCondition = (code: string): ParsedCondition => {
  const parsed = tseslint.parser.parseForESLint(code);

  assert.ok(isProgram(parsed.ast), 'parser must return a Program');
  assert.ok(isScopeManager(parsed.scopeManager), 'parser must return scopes');

  const statement = parsed.ast.body.at(-1);
  const { globalScope } = parsed.scopeManager;

  assert.ok(statement?.type === TSESTree.AST_NODE_TYPES.IfStatement);
  assert.ok(globalScope, 'parser must return a global scope');

  const result: ParsedCondition = {
    condition: statement.test,
    scope: globalScope
  };

  return result;
};
