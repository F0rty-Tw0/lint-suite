import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { RuleTester } from 'eslint';
import type { ESLint, Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import ruleModule from './no-call-in-condition.ts';
import { definePlugin } from '../define-plugin.util.ts';

const ruleName = 'no-call-in-condition';
const plugin: ESLint.Plugin = definePlugin('local', {
  [ruleName]: ruleModule
});
const rule = plugin.rules?.[ruleName];

assert.ok(rule, 'local plugin must expose no-call-in-condition');

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

const ruleTester = new RuleTester({ languageOptions });

const fixtures = join(import.meta.dirname, 'common', 'fixtures', 'predicates');
const parserOptions = { projectService: true, tsconfigRootDir: fixtures };
const typedLanguageOptions: Linter.LanguageOptions = {
  ...languageOptions,
  parserOptions
};
const typedTester = new RuleTester({ languageOptions: typedLanguageOptions });

const fixtureCode = (file: string): string => {
  return readFileSync(join(fixtures, file), 'utf8');
};

const hoistSuggestion = (
  name: string,
  output: string
): RuleTester.SuggestionOutput => {
  const data = { name };
  const hoistCall: RuleTester.SuggestionOutput = {
    messageId: 'hoistCall',
    data,
    output
  };

  return hoistCall;
};

const hoisted = (
  callee: string,
  name: string,
  output: string
): RuleTester.TestCaseError[] => {
  const suggestions = [hoistSuggestion(name, output)];
  const data = { callee };
  const error: RuleTester.TestCaseError = {
    messageId: 'callInCondition',
    data,
    suggestions
  };

  return [error];
};

const namelessError: RuleTester.TestCaseError[] = [
  { messageId: 'callInCondition', suggestions: [] }
];

const signalClassLines = [
  'class Panel {',
  '  render() {',
  '    if (this.check(1)) return;',
  '  }',
  '}'
];
const signalClass = signalClassLines.join('\n');
const signalClassOutputLines = [
  'class Panel {',
  '  render() {',
  '    const checkResult = this.check(1);',
  '    if (checkResult) return;',
  '  }',
  '}'
];
const signalClassOutput = signalClassOutputLines.join('\n');

const boolConstLines = [
  'const isNamed = validate(order) && order.name;',
  '',
  'if (isNamed) {}'
];
const boolConst = boolConstLines.join('\n');
const boolConstOutputLines = [
  'const validateResult = validate(order);',
  'const isNamed = validateResult && order.name;',
  '',
  'if (isNamed) {}'
];
const boolConstOutput = boolConstOutputLines.join('\n');

const predicateInlineLines = [
  'const looksLikeFoo = (value: unknown): value is Foo => true;',
  'if (looksLikeFoo(input)) {}'
];
const predicateInlineCode = predicateInlineLines.join('\n');
const looksPredicateOptions = [{ allowPredicates: ['^looks'] }];
const namedConstLines = [
  'const isNamed = validate(order);',
  '',
  'if (isNamed) {}'
];
const namedConstCode = namedConstLines.join('\n');

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts a condition built from names and comparisons',
    code: `if (isReady && count > 2) {}`
  },
  {
    name: 'accepts a zero-argument signal read on this',
    code: `class Panel { render() { if (this.loading()) return; } }`
  },
  {
    name: 'accepts a same-file type predicate used inline',
    code: predicateInlineCode
  },
  {
    name: 'accepts a callee matching allowPredicates without a program',
    code: `if (isFoo(input)) {}`
  },
  {
    name: 'accepts a callee matching a custom allowPredicates pattern',
    code: `if (looksFoo(input)) {}`,
    options: looksPredicateOptions
  },
  {
    name: 'ignores a while loop condition',
    code: `while (validate(order)) {}`
  },
  {
    name: 'ignores a call in a const that no if reads',
    code: `const isNamed = validate(order) && order.name;`
  },
  {
    name: 'accepts a const that already holds a bare call',
    code: namedConstCode
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'reports a bare call in the condition',
    code: `if (validate(order)) {}`,
    errors: hoisted(
      'validate',
      'validateResult',
      `const validateResult = validate(order);\nif (validateResult) {}`
    )
  },
  {
    name: 'reports a negated call',
    code: `if (!validate(order)) {}`,
    errors: hoisted(
      'validate',
      'validateResult',
      `const validateResult = validate(order);\nif (!validateResult) {}`
    )
  },
  {
    name: 'reports a call joined by a logical operator',
    code: `if (isReady && validate(order)) {}`,
    errors: hoisted(
      'validate',
      'validateResult',
      `const validateResult = validate(order);\nif (isReady && validateResult) {}`
    )
  },
  {
    name: 'reports a call compared to a value',
    code: `if (countLines(order) > 2) {}`,
    errors: hoisted(
      'countLines',
      'countLinesResult',
      `const countLinesResult = countLines(order);\nif (countLinesResult > 2) {}`
    )
  },
  {
    name: 'reports a call inside a boolean const feeding an if',
    code: boolConst,
    errors: hoisted('validate', 'validateResult', boolConstOutput)
  },
  {
    name: 'reports a this call that takes arguments',
    code: signalClass,
    errors: hoisted('this.check', 'checkResult', signalClassOutput)
  },
  {
    name: 'reports a method call on another object',
    code: `if (order.validate()) {}`,
    errors: hoisted(
      'order.validate',
      'validateResult',
      `const validateResult = order.validate();\nif (validateResult) {}`
    )
  },
  {
    name: 'reports without a suggestion when the callee has no name',
    code: `if (guards["check"](order)) {}`,
    errors: namelessError
  },
  {
    name: 'reports without a suggestion when the if is an else-if branch',
    code: `if (a) {} else if (validate(order)) {}`,
    errors: namelessError
  }
];

ruleTester.run('local/no-call-in-condition', rule, { valid, invalid });

const memberCallOutput = fixtureCode('member-call.ts').replace(
  '  if (helpers.compute(value)) return',
  '  const computeResult = helpers.compute(value);\n  if (computeResult) return'
);

const typedValid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts a checker-resolved member predicate',
    code: fixtureCode('member-predicate.ts'),
    filename: join(fixtures, 'member-predicate.ts')
  }
];

const typedInvalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'reports a member call the checker cannot exempt',
    code: fixtureCode('member-call.ts'),
    filename: join(fixtures, 'member-call.ts'),
    errors: hoisted('helpers.compute', 'computeResult', memberCallOutput)
  }
];

typedTester.run('local/no-call-in-condition', rule, {
  valid: typedValid,
  invalid: typedInvalid
});
