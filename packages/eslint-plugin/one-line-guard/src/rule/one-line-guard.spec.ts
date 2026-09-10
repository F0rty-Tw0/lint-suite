import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import plugin from '../index.ts';

const rule = plugin.rules?.['one-line-guard'];

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

const options = [{ maxLineLength: 40 }];

const oneLineGuardError: RuleTester.TestCaseError = {
  messageId: 'oneLineGuard'
};

const throwErrorData = { keyword: 'throw', max: 40 };
const throwError: RuleTester.TestCaseError = {
  messageId: 'oneLineGuard',
  data: throwErrorData
};

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts an already one-line guard',
    code: `if (!x) return null;`,
    options
  },
  {
    name: 'ignores a block with two statements',
    code: `if (x) {\n  foo();\n  return null;\n}`,
    options
  },
  {
    name: 'ignores an if with an else',
    code: `if (x) {\n  return 1;\n} else {\n  return 2;\n}`,
    options
  },
  {
    name: 'ignores a lone body that is an expression statement',
    code: `if (x) {\n  doIt();\n}`,
    options
  },
  {
    name: 'ignores a block containing a comment',
    code: `if (x) {\n  // keep\n  return 1;\n}`,
    options
  },
  {
    name: 'ignores a guard whose collapsed line would exceed maxLineLength',
    code: `if (x) {\n  return someExtremelyLongIdentifierNameThatOverflowsTheLimit;\n}`,
    options
  },
  {
    name: 'ignores a multi-line condition',
    code: `if (\n  a &&\n  b\n) {\n  return 1;\n}`,
    options
  },
  {
    name: 'ignores a multi-line body',
    code: `if (x) {\n  return {\n    a: 1\n  };\n}`,
    options
  },
  {
    name: 'ignores a guard whose collapsed line is one column over the limit',
    code: `if (a) {\n  return xxxxxxxxxxxxxxxxxxxxxxxxxx;\n}`,
    options
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'fixes a lone return guard',
    code: `if (!user) {\n  return null;\n}`,
    output: `if (!user) return null;`,
    options,
    errors: [oneLineGuardError]
  },
  {
    name: 'fixes a lone throw guard',
    code: `if (!ok) {\n  throw err;\n}`,
    output: `if (!ok) throw err;`,
    options,
    errors: [throwError]
  },
  {
    name: 'fixes a lone continue guard inside a for loop',
    code: `for (const item of items) {\n  if (!item) {\n    continue;\n  }\n}`,
    output: `for (const item of items) {\n  if (!item) continue;\n}`,
    options,
    errors: [oneLineGuardError]
  },
  {
    name: 'fixes a lone break guard inside a while loop',
    code: `while (running) {\n  if (done) {\n    break;\n  }\n}`,
    output: `while (running) {\n  if (done) break;\n}`,
    options,
    errors: [oneLineGuardError]
  },
  {
    name: 'fixes an indented guard inside a function keeping indentation',
    code: `function f(x) {\n  if (x) {\n    return 1;\n  }\n}`,
    output: `function f(x) {\n  if (x) return 1;\n}`,
    options,
    errors: [oneLineGuardError]
  },
  {
    name: 'reports only the inner guard of an else-if chain',
    code: `if (a) {\n  foo();\n} else if (b) {\n  return 1;\n}`,
    output: `if (a) {\n  foo();\n} else if (b) return 1;`,
    options,
    errors: [oneLineGuardError]
  },
  {
    name: 'reports a guard whose collapsed line is exactly at the limit',
    code: `if (a) {\n  return xxxxxxxxxxxxxxxxxxxxxxxxx;\n}`,
    output: `if (a) return xxxxxxxxxxxxxxxxxxxxxxxxx;`,
    options,
    errors: [oneLineGuardError]
  }
];

ruleTester.run('one-line-guard/one-line-guard', rule, { valid, invalid });
