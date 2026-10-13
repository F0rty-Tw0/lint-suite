import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import plugin from '../index.ts';

const rule = plugin.rules?.['arrow-body-fits-line'];

assert.ok(rule);

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

const ruleTester = new RuleTester({ languageOptions });

const arrowBodyWrappedError: RuleTester.TestCaseError = {
  messageId: 'arrowBodyWrapped'
};

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'allows a single-line expression body',
    code: `const h = (x) => x.id;`
  },
  {
    name: 'allows a multi-line expression arrow with an object body',
    code: `const i = () => ({\n  a: 1\n});`
  },
  {
    name: 'ignores a block-bodied arrow spanning multiple lines',
    code: `const j = () => {\n  return 1;\n};`
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'wraps a multi-line logical-operator body',
    code: `const f = (x) => x.a &&\n  x.b;`,
    output: `const f = (x) => {\n  return x.a &&\n  x.b;\n};`,
    errors: [arrowBodyWrappedError]
  },
  {
    name: 'wraps a multi-line parenthesised body, dropping the parens',
    code: `const g = () => (\n  a &&\n  b\n);`,
    output: `const g = () => {\n  return a &&\n  b;\n};`,
    errors: [arrowBodyWrappedError]
  }
];

ruleTester.run('local/arrow-body-fits-line', rule, { valid, invalid });
