import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import plugin from '../index.ts';

const rule = plugin.rules?.['chain-receiver-is-name'];

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

const errorWithFix = (output: string): RuleTester.TestCaseError => {
  const suggestions: RuleTester.SuggestionOutput[] = [
    { messageId: 'extractReceiver', output }
  ];
  const error: RuleTester.TestCaseError = {
    messageId: 'chainReceiver',
    suggestions
  };

  return error;
};

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts a chain rooted at a plain member access',
    code: `a.b.c;`
  },
  {
    name: 'accepts a chain rooted at a call expression',
    code: `foo().bar;`
  },
  {
    name: 'accepts a chain rooted at this',
    code: `this.value;`
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'reports and fixes a logical expression receiver',
    code: `(a || b).c;`,
    output: null,
    errors: [errorWithFix(`const value = a || b;\n(value).c;`)]
  },
  {
    name: 'reports and fixes a conditional expression receiver',
    code: `(a ? b : c).d;`,
    output: null,
    errors: [errorWithFix(`const value = a ? b : c;\n(value).d;`)]
  },
  {
    name: 'reports and fixes an object expression receiver',
    code: `({ a: 1 }).b;`,
    output: null,
    errors: [errorWithFix(`const value = { a: 1 };\n(value).b;`)]
  },
  {
    name: 'reports and fixes an array expression receiver',
    code: `[1, 2].length;`,
    output: null,
    errors: [errorWithFix(`const value = [1, 2];\nvalue.length;`)]
  },
  {
    name: 'reports and fixes an await expression receiver',
    code: `async function f() {\n  (await a).b;\n}`,
    output: null,
    errors: [
      errorWithFix(
        `async function f() {\n  const value = await a;\n  (value).b;\n}`
      )
    ]
  },
  {
    name: 'reports and fixes a binary expression receiver',
    code: `(a + b).c;`,
    output: null,
    errors: [errorWithFix(`const value = a + b;\n(value).c;`)]
  },
  {
    name: 'reports and fixes a template literal receiver',
    code: '`${a}`.length;',
    output: null,
    errors: [errorWithFix('const value = `${a}`;\nvalue.length;')]
  }
];

ruleTester.run('chain-receiver-is-name/chain-receiver-is-name', rule, {
  valid,
  invalid
});
