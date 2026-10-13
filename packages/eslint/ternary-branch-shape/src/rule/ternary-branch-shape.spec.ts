import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import plugin from '../index.ts';

const rule = plugin.rules?.['ternary-branch-shape'];

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

const consequentData = { branch: 'consequent' };

const consequentError: RuleTester.TestCaseError = {
  messageId: 'ternaryBranch',
  data: consequentData
};

const alternateData = { branch: 'alternate' };

const alternateError: RuleTester.TestCaseError = {
  messageId: 'ternaryBranch',
  data: alternateData
};

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts identifiers in both branches',
    code: `cond ? a : b;`
  },
  {
    name: 'accepts literals in both branches',
    code: `cond ? 1 : 'x';`
  },
  {
    name: 'accepts a template literal branch',
    code: 'cond ? `a` : b;'
  },
  {
    name: 'accepts a plain member chain of any depth',
    code: `cond ? a.b.c : d;`
  },
  {
    name: 'accepts a computed member access with no call',
    code: `cond ? a[b] : c;`
  },
  {
    name: 'accepts a unary minus over a literal',
    code: `cond ? -1 : 2;`
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'reports a call expression in the consequent',
    code: `cond ? foo() : b;`,
    errors: [consequentError]
  },
  {
    name: 'reports a binary expression in the alternate',
    code: `cond ? a : b + c;`,
    errors: [alternateError]
  },
  {
    name: 'reports a member chain with a call in the object chain',
    code: `cond ? a.b().c : d;`,
    errors: [consequentError]
  },
  {
    name: 'reports a unary expression whose argument is not a literal',
    code: `cond ? -x : y;`,
    errors: [consequentError]
  },
  {
    name: 'reports both branches when both are calls',
    code: `cond ? foo() : bar();`,
    errors: [consequentError, alternateError]
  }
];

ruleTester.run('ternary-branch-shape/ternary-branch-shape', rule, {
  valid,
  invalid
});
