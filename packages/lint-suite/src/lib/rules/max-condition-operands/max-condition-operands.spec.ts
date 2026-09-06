import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import { typescript } from '../../typescript.ts';

const rule = typescript.map((config) => config.plugins?.['local']).find(Boolean)
  ?.rules?.['max-condition-operands'];

assert.ok(rule, 'typescript preset must register local/max-condition-operands');

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

const ruleTester = new RuleTester({ languageOptions });

const tooManyOperandsError = (
  count: number,
  max: number
): RuleTester.TestCaseError => {
  const data = { count, max };
  const error: RuleTester.TestCaseError = {
    messageId: 'tooManyOperands',
    data
  };

  return error;
};

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts a condition with 3 operands',
    code: `if (a && b && c) {}`
  },
  {
    name: 'ignores 4 operands in a plain const declaration',
    code: `const x = a && b && c && d;`
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'reports a condition with 4 operands',
    code: `if (a && b && c && d) {}`,
    errors: [tooManyOperandsError(4, 3)]
  },
  {
    name: 'reports a condition with 5 operands',
    code: `if (a && b && c && d && e) {}`,
    errors: [tooManyOperandsError(5, 3)]
  }
];

ruleTester.run('local/max-condition-operands', rule, { valid, invalid });
