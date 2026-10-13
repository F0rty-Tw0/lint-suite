import assert from 'node:assert/strict';

import { Linter, RuleTester } from 'eslint';
import type { ESLint } from 'eslint';
import { describe, test } from 'vitest';

import plugin from '../../../index.ts';
import { LINTER_LANGUAGE_OPTIONS_STUB } from '@lint-suite/rule-test-support/stubs/linter-config.stub.ts';

import type {
  DepConstraint,
  RuleOptions
} from '../../common/modular-boundaries.type.ts';

const pluginRule = plugin.rules?.['modular-boundaries'];

assert.ok(pluginRule);

const rule: NonNullable<ESLint.Plugin['rules']>[string] = pluginRule;

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

export { rule };

export const ruleName = 'modular-boundaries/modular-boundaries';

export const ruleTester = (): RuleTester => {
  const languageOptions = LINTER_LANGUAGE_OPTIONS_STUB;

  return new RuleTester({ languageOptions });
};

export const constraintOptions = (constraint: DepConstraint): RuleOptions => {
  const options: RuleOptions = { depConstraints: [constraint] };

  return options;
};

export const validCase = (
  name: string,
  filename: string,
  code: string,
  options: RuleOptions = {}
): RuleTester.ValidTestCase => {
  const ruleOptions = [options];
  const testCase: RuleTester.ValidTestCase = {
    name,
    filename,
    code,
    options: ruleOptions
  };

  return testCase;
};

const errorFor = (messageId: string): RuleTester.TestCaseError => {
  const error: RuleTester.TestCaseError = { messageId };

  return error;
};

export const invalidCase = (
  testCase: RuleTester.ValidTestCase,
  ...messageIds: string[]
): RuleTester.InvalidTestCase => {
  const errors = messageIds.map(errorFor);
  const invalid: RuleTester.InvalidTestCase = { ...testCase, errors };

  return invalid;
};

/** Lints `code` as `filename` with a raw `Linter` rooted at `directory`; throws on invalid options. */
export const lintWithRule = (
  directory: string,
  filename: string,
  code: string,
  options: RuleOptions | Record<string, unknown> = {}
): Linter.LintMessage[] => {
  const plugins = { 'modular-boundaries': plugin };
  const ruleEntry: Linter.RuleEntry = ['error', options];
  const rules = { [ruleName]: ruleEntry };
  const config: Linter.Config = {
    files: ['**/*.ts'],
    languageOptions: LINTER_LANGUAGE_OPTIONS_STUB,
    plugins,
    rules
  };
  const linter = new Linter({ cwd: directory });

  return linter.verify(code, config, filename);
};
