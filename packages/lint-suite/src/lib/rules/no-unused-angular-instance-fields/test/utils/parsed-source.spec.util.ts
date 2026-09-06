import assert from 'node:assert/strict';

import { TSESLint, TSESTree } from '@typescript-eslint/utils';
import tseslint from 'typescript-eslint';

type ParsedSource = {
  readonly ast: TSESTree.Program;
  readonly sourceCode: TSESLint.SourceCode;
};

const isProgram = (value: unknown): value is TSESLint.SourceCode.Program => {
  const isObject = typeof value === 'object' && value !== null;

  if (!isObject) return false;

  if (!('type' in value)) return false;

  if (!('tokens' in value)) return false;

  if (!('comments' in value)) return false;

  return value.type === TSESTree.AST_NODE_TYPES.Program;
};

export const parseSource = (code: string): ParsedSource => {
  const parsed = tseslint.parser.parseForESLint(code);

  assert.ok(isProgram(parsed.ast), 'parser must return a Program');

  const sourceCode = new TSESLint.SourceCode({
    ast: parsed.ast,
    parserServices: null,
    scopeManager: null,
    text: code,
    visitorKeys: null
  });
  const source: ParsedSource = { ast: parsed.ast, sourceCode };

  return source;
};
