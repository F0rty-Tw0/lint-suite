import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import { typescript } from '../../typescript.ts';

const rule = typescript.map((config) => config.plugins?.['local']).find(Boolean)
  ?.rules?.['chain-fits-line'];

assert.ok(rule, 'typescript preset must register local/chain-fits-line');

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

const ruleTester = new RuleTester({ languageOptions });

const chainWrappedError: RuleTester.TestCaseError = {
  messageId: 'chainWrapped'
};

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts a two-call chain on one line',
    code: `a.b().c();`
  },
  {
    name: 'accepts a single call with a multi-line callback argument',
    code: `items\n  .map((x) => {\n  return x;\n});`
  },
  {
    name: 'accepts a single call',
    code: `foo.bar();`
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'reports a two-call chain wrapped across lines',
    code: `a\n  .b()\n  .c();`,
    errors: [chainWrappedError]
  },
  {
    name: 'reports a chain where only the last call wraps to a new line',
    code: `a.b().c()\n  .d();`,
    errors: [chainWrappedError]
  }
];

ruleTester.run('local/chain-fits-line', rule, { valid, invalid });
