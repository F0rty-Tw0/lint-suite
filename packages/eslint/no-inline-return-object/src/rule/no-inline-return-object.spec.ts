import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import plugin from '../index.ts';

const rule = plugin.rules?.['no-inline-return-object'];

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

const inlineReturnObjectError: RuleTester.TestCaseError = {
  messageId: 'inlineReturnObject'
};

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'allows returning a non-object value',
    code: `function f() {\n  return 1;\n}`
  },
  {
    name: 'allows returning an already named result',
    code: `function f() {\n  const result = { a: 1 };\n\n  return result;\n}`
  },
  {
    name: 'allows an arrow with a non-object expression body',
    code: `const f = () => 1;`
  },
  {
    name: 'allows an arrow returning an array expression body',
    code: `const f = () => [1, 2];`
  }
];

const hoistsLiteralSuggestion: RuleTester.SuggestionOutput = {
  messageId: 'inlineReturnObject',
  output: `function f() {\n  const result = { a: 1 };\n\n  return result;\n}`
};
const hoistsLiteralErrors: RuleTester.TestCaseError[] = [
  { ...inlineReturnObjectError, suggestions: [hoistsLiteralSuggestion] }
];

const hoistsEmptyLiteralSuggestion: RuleTester.SuggestionOutput = {
  messageId: 'inlineReturnObject',
  output: `function f() {\n  const result = {};\n\n  return result;\n}`
};
const hoistsEmptyLiteralErrors: RuleTester.TestCaseError[] = [
  { ...inlineReturnObjectError, suggestions: [hoistsEmptyLiteralSuggestion] }
];

const arrowBlockReturnSuggestion: RuleTester.SuggestionOutput = {
  messageId: 'inlineReturnObject',
  output: `const f = () => {\n  const result = { a: 1 };\n\n  return result;\n};`
};
const arrowBlockReturnErrors: RuleTester.TestCaseError[] = [
  { ...inlineReturnObjectError, suggestions: [arrowBlockReturnSuggestion] }
];

const arrowExpressionBodySuggestion: RuleTester.SuggestionOutput = {
  messageId: 'inlineReturnObject',
  output: `const f = () => {\n  const result = { a: 1 };\n\n  return result;\n};`
};
const arrowExpressionBodyErrors: RuleTester.TestCaseError[] = [
  { ...inlineReturnObjectError, suggestions: [arrowExpressionBodySuggestion] }
];

const nestedArrowIndentSuggestion: RuleTester.SuggestionOutput = {
  messageId: 'inlineReturnObject',
  output: `class C {\n  method() {\n    const f = () => {\n      const result = { a: 1 };\n\n      return result;\n    };\n  }\n}`
};
const nestedArrowIndentErrors: RuleTester.TestCaseError[] = [
  { ...inlineReturnObjectError, suggestions: [nestedArrowIndentSuggestion] }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'hoists a returned object literal',
    code: `function f() {\n  return { a: 1 };\n}`,
    output: null,
    errors: hoistsLiteralErrors
  },
  {
    name: 'hoists an empty returned object literal',
    code: `function f() {\n  return {};\n}`,
    output: null,
    errors: hoistsEmptyLiteralErrors
  },
  {
    name: 'reports a return inside an arrow block body',
    code: `const f = () => {\n  return { a: 1 };\n};`,
    output: null,
    errors: arrowBlockReturnErrors
  },
  {
    name: 'wraps a top-level arrow expression body into a block',
    code: `const f = () => ({ a: 1 });`,
    output: null,
    errors: arrowExpressionBodyErrors
  },
  {
    name: 'keeps the enclosing indentation when wrapping a nested arrow',
    code: `class C {\n  method() {\n    const f = () => ({ a: 1 });\n  }\n}`,
    output: null,
    errors: nestedArrowIndentErrors
  }
];

ruleTester.run('no-inline-return-object/no-inline-return-object', rule, {
  valid,
  invalid
});
