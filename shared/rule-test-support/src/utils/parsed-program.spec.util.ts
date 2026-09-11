import assert from 'node:assert/strict';

import { TSESTree } from '@typescript-eslint/utils';
import tseslint from 'typescript-eslint';

export const isProgram = (value: unknown): value is TSESTree.Program => {
  const isObject = typeof value === 'object' && value !== null;

  if (!isObject) return false;

  if (!('body' in value)) return false;

  if (!('type' in value)) return false;

  return value.type === TSESTree.AST_NODE_TYPES.Program;
};

export const programOf = (code: string): TSESTree.Program => {
  const parsed = tseslint.parser.parseForESLint(code);

  assert.ok(isProgram(parsed.ast), 'parser must return a Program');

  return parsed.ast;
};
