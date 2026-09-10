import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import plugin from '../index.ts';

const rule = plugin.rules?.['no-nested-object-value'];

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

const nestedValueError = (key: string): RuleTester.TestCaseError => {
  const data = { key };
  const error: RuleTester.TestCaseError = { messageId: 'nestedValue', data };

  return error;
};

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'allows an empty nested object value',
    code: `const o = { a: {} };`
  },
  {
    name: 'allows an empty array value',
    code: `const o = { a: [] };`
  },
  {
    name: 'allows an array of identifiers',
    code: `const o = { a: [x, y] };`
  },
  {
    name: 'allows a plain member access value',
    code: `const o = { a: b.c };`
  },
  {
    name: 'allows a single call that is not a chain',
    code: `const o = { a: foo.bar() };`
  },
  {
    name: 'skips a property inside a destructuring pattern',
    code: `const { a: { b } } = obj;`
  },
  {
    name: 'exempts nested config inside a decorator argument',
    code: `@Component({ providers: [{ provide: A, useClass: B }] }) class C {}`
  },
  {
    name: 'exempts a config file matched by the configFiles glob',
    code: `const o = { a: { b: 1 } };`,
    filename: '/x/eslint.config.ts'
  },
  {
    name: 'exempts a schema file by default',
    code: `const user = z.object({ name: z.string().min(1) });`,
    filename: '/x/user.schema.ts'
  }
];

const hoistsObjectData = { key: 'a' };
const hoistsObjectSuggestion: RuleTester.SuggestionOutput = {
  messageId: 'nestedValue',
  data: hoistsObjectData,
  output: `const a = { b: 1 };\nconst o = { a: a };`
};
const hoistsObjectBaseError = nestedValueError('a');
const hoistsObjectErrors: RuleTester.TestCaseError[] = [
  { ...hoistsObjectBaseError, suggestions: [hoistsObjectSuggestion] }
];

const hoistsArrayData = { key: 'list' };
const hoistsArraySuggestion: RuleTester.SuggestionOutput = {
  messageId: 'nestedValue',
  data: hoistsArrayData,
  output: `const list = [{ x: 1 }];\nconst o = { list: list };`
};
const hoistsArrayBaseError = nestedValueError('list');
const hoistsArrayErrors: RuleTester.TestCaseError[] = [
  { ...hoistsArrayBaseError, suggestions: [hoistsArraySuggestion] }
];

const hoistsConditionalData = { key: 'a' };
const hoistsConditionalSuggestion: RuleTester.SuggestionOutput = {
  messageId: 'nestedValue',
  data: hoistsConditionalData,
  output: `const a = cond ? 1 : 2;\nconst o = { a: a };`
};
const hoistsConditionalBaseError = nestedValueError('a');
const hoistsConditionalErrors: RuleTester.TestCaseError[] = [
  { ...hoistsConditionalBaseError, suggestions: [hoistsConditionalSuggestion] }
];

const hoistsChainedCallData = { key: 'a' };
const hoistsChainedCallSuggestion: RuleTester.SuggestionOutput = {
  messageId: 'nestedValue',
  data: hoistsChainedCallData,
  output: `const a = foo().bar();\nconst o = { a: a };`
};
const hoistsChainedCallBaseError = nestedValueError('a');
const hoistsChainedCallErrors: RuleTester.TestCaseError[] = [
  { ...hoistsChainedCallBaseError, suggestions: [hoistsChainedCallSuggestion] }
];

const noSuggestions: RuleTester.SuggestionOutput[] = [];
const computedKeyBaseError = nestedValueError('computedKey');
const computedKeyErrors: RuleTester.TestCaseError[] = [
  { ...computedKeyBaseError, suggestions: noSuggestions }
];

const stringKeyBaseError = nestedValueError("'complex-key'");
const stringKeyErrors: RuleTester.TestCaseError[] = [
  { ...stringKeyBaseError, suggestions: noSuggestions }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'hoists a nested object value',
    code: `const o = { a: { b: 1 } };`,
    output: null,
    errors: hoistsObjectErrors
  },
  {
    name: 'hoists an array containing an object element',
    code: `const o = { list: [{ x: 1 }] };`,
    output: null,
    errors: hoistsArrayErrors
  },
  {
    name: 'hoists a conditional value',
    code: `const o = { a: cond ? 1 : 2 };`,
    output: null,
    errors: hoistsConditionalErrors
  },
  {
    name: 'hoists a chained call value',
    code: `const o = { a: foo().bar() };`,
    output: null,
    errors: hoistsChainedCallErrors
  },
  {
    name: 'reports without a suggestion for a computed key',
    code: `const o = { [computedKey]: { b: 1 } };`,
    output: null,
    errors: computedKeyErrors
  },
  {
    name: 'reports without a suggestion for a string literal key',
    code: `const o = { 'complex-key': { b: 1 } };`,
    output: null,
    errors: stringKeyErrors
  }
];

ruleTester.run('no-nested-object-value/no-nested-object-value', rule, {
  valid,
  invalid
});
