import assert from 'node:assert/strict';

import { test } from 'vitest';

import { indentOf } from './indent-of.util.ts';
import { parseSource } from '../no-unused-angular-instance-fields/test/utils/parsed-source.spec.util.ts';

const statementIndent = (code: string, index: number): string => {
  const { ast, sourceCode } = parseSource(code);
  const statement = ast.body[index];

  assert.ok(statement, 'statement must exist');

  return indentOf(statement, sourceCode);
};

test('returns the leading whitespace of the node line', () => {
  assert.equal(statementIndent('  const a = 1;', 0), '  ');
  assert.equal(statementIndent('\tconst a = 1;', 0), '\t');
});

test('returns an empty string for a node at column zero', () => {
  assert.equal(statementIndent('const a = 1;', 0), '');
});

test('reads only whitespace, not text before a mid-line node', () => {
  assert.equal(statementIndent('  a; b;', 1), '  ');
});
