import assert from 'node:assert/strict';

import { TSESLint } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import tseslint from 'typescript-eslint';
import { test } from 'vitest';

import { enclosingStatement } from './enclosing-statement.util.ts';
import { programOf } from '../test/utils/parsed-program.spec.util.ts';

type Captured = {
  readonly declarations: TSESTree.VariableDeclaration[];
  readonly receivers: TSESTree.Node[];
};

const linter = new TSESLint.Linter({ configType: 'flat' });

const capture = (code: string): Captured => {
  const declarations: TSESTree.VariableDeclaration[] = [];
  const receivers: TSESTree.Node[] = [];
  const listeners: TSESLint.RuleListener = {
    MemberExpression: (node: TSESTree.MemberExpression): void => {
      receivers.push(node.object);
    },
    VariableDeclaration: (node: TSESTree.VariableDeclaration): void => {
      declarations.push(node);
    }
  };
  const messages = { captured: 'captured' };
  const meta: TSESLint.RuleMetaData<'captured'> = {
    type: 'problem',
    schema: [],
    messages
  };
  const rule: TSESLint.RuleModule<'captured'> = {
    meta,
    defaultOptions: [],
    create: (): TSESLint.RuleListener => listeners
  };
  const rules = { capture: rule };
  const plugin: TSESLint.FlatConfig.Plugin = { rules };
  const plugins = { spec: plugin };
  const languageOptions: TSESLint.FlatConfig.LanguageOptions = {
    parser: tseslint.parser
  };
  const ruleEntries: TSESLint.FlatConfig.Rules = { 'spec/capture': 'error' };
  const config: TSESLint.FlatConfig.Config = {
    languageOptions,
    plugins,
    rules: ruleEntries
  };

  linter.verify(code, config);

  const captured: Captured = { declarations, receivers };

  return captured;
};

test('climbs to the statement directly under the program', () => {
  const { declarations, receivers } = capture('const a = b.c();');
  const [receiver] = receivers;
  const [declaration] = declarations;

  assert.ok(receiver, 'receiver must be captured');
  assert.equal(enclosingStatement(receiver), declaration);
});

test('stops at the statement inside a block, not the block', () => {
  const { declarations, receivers } = capture(
    'function f() { const a = b.c(); }'
  );
  const [receiver] = receivers;
  const [declaration] = declarations;

  assert.ok(receiver, 'receiver must be captured');
  assert.equal(enclosingStatement(receiver), declaration);
});

test('returns the program node itself', () => {
  const program = programOf('a;');

  assert.equal(enclosingStatement(program), program);
});
