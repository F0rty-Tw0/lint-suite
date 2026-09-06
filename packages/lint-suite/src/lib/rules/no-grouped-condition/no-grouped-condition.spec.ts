import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import { typescript } from '../../typescript.ts';

const rule = typescript.map((config) => config.plugins?.['local']).find(Boolean)
  ?.rules?.['no-grouped-condition'];

assert.ok(rule, 'typescript preset must register local/no-grouped-condition');

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

const ruleTester = new RuleTester({ languageOptions });

const hoistSuggestion = (output: string): RuleTester.SuggestionOutput => {
  const suggestion: RuleTester.SuggestionOutput = {
    messageId: 'hoistGroup',
    output
  };

  return suggestion;
};

const groupedConditionError = (
  output: string
): RuleTester.TestCaseError => {
  const suggestions = [hoistSuggestion(output)];
  const error: RuleTester.TestCaseError = {
    messageId: 'groupedCondition',
    suggestions
  };

  return error;
};

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'ignores same-operator nesting',
    code: `if (a || b || c) {}`
  },
  {
    name: 'ignores a grouped condition inside a while loop',
    code: `while (a && (b || c)) {}`
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'reports a grouped condition inside an if statement',
    code: `if (a && (b || c)) {}`,
    errors: [
      groupedConditionError(
        `const isGroup = b || c;\nif (a && (isGroup)) {}`
      )
    ]
  },
  {
    name: 'reports a grouped condition inside a const declaration',
    code: `const result = a && (b || c);`,
    errors: [
      groupedConditionError(
        `const isGroup = b || c;\nconst result = a && (isGroup);`
      )
    ]
  },
  {
    name: 'reports a leading group before a differing operator',
    code: `if ((a || b) && c) {}`,
    errors: [
      groupedConditionError(`const isGroup = a || b;\nif ((isGroup) && c) {}`)
    ]
  }
];

ruleTester.run('local/no-grouped-condition', rule, { valid, invalid });
