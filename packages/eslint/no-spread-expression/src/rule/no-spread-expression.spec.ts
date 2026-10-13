import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import plugin from '../index.ts';

const rule = plugin.rules?.['no-spread-expression'];

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

const spreadExpressionError: RuleTester.TestCaseError = {
  messageId: 'spreadExpression'
};

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'allows spreading an identifier into a call',
    code: `f(...args);`
  },
  {
    name: 'allows spreading a member access into a call',
    code: `f(...obj.args);`
  },
  {
    name: 'allows spreading a member access into an array literal',
    code: `const a = [...arr.items];`
  },
  {
    name: 'allows spreading a member access into an object literal',
    code: `const o = { ...obj.props };`
  }
];

const callSpreadArgumentSuggestion: RuleTester.SuggestionOutput = {
  messageId: 'spreadExpression',
  output: `const spread = getArgs();\nf(...spread);`
};
const callSpreadArgumentErrors: RuleTester.TestCaseError[] = [
  { ...spreadExpressionError, suggestions: [callSpreadArgumentSuggestion] }
];

const callSpreadArraySuggestion: RuleTester.SuggestionOutput = {
  messageId: 'spreadExpression',
  output: `const spread = getItems();\nconst a = [...spread];`
};
const callSpreadArrayErrors: RuleTester.TestCaseError[] = [
  { ...spreadExpressionError, suggestions: [callSpreadArraySuggestion] }
];

const objectLiteralSpreadSuggestion: RuleTester.SuggestionOutput = {
  messageId: 'spreadExpression',
  output: `const spread = { a: 1 };\nconst o = { ...spread };`
};
const objectLiteralSpreadErrors: RuleTester.TestCaseError[] = [
  { ...spreadExpressionError, suggestions: [objectLiteralSpreadSuggestion] }
];

const enclosingIndentSuggestion: RuleTester.SuggestionOutput = {
  messageId: 'spreadExpression',
  output: `function f() {\n  const spread = getItems();\n  return [...spread];\n}`
};
const enclosingIndentErrors: RuleTester.TestCaseError[] = [
  { ...spreadExpressionError, suggestions: [enclosingIndentSuggestion] }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'hoists a call spread into a call argument',
    code: `f(...getArgs());`,
    output: null,
    errors: callSpreadArgumentErrors
  },
  {
    name: 'hoists a call spread inside an array literal',
    code: `const a = [...getItems()];`,
    output: null,
    errors: callSpreadArrayErrors
  },
  {
    name: 'hoists an object literal spread',
    code: `const o = { ...{ a: 1 } };`,
    output: null,
    errors: objectLiteralSpreadErrors
  },
  {
    name: 'keeps the enclosing indentation when hoisting inside a function',
    code: `function f() {\n  return [...getItems()];\n}`,
    output: null,
    errors: enclosingIndentErrors
  }
];

ruleTester.run('no-spread-expression/no-spread-expression', rule, {
  valid,
  invalid
});
