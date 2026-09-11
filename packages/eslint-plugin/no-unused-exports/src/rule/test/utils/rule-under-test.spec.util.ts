import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { ESLint } from 'eslint';
import { describe, test, vi } from 'vitest';

import plugin from '../../../index.ts';
import { fixtureCase } from './fixture-project.spec.util.ts';

const pluginRule = plugin.rules?.['no-unused-exports'];

assert.ok(pluginRule);

const rule: NonNullable<ESLint.Plugin['rules']>[string] = pluginRule;

vi.setConfig({ testTimeout: 120_000 });

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

export { rule };

export const ruleName = 'no-unused-exports/no-unused-exports';

export const exportError = (name: string): RuleTester.TestCaseError => {
  const data = { name };
  const error: RuleTester.TestCaseError = { messageId: 'unusedExport', data };

  return error;
};

export const moduleError: RuleTester.TestCaseError = {
  messageId: 'unusedModule'
};

export const validCase = (
  name: string,
  directory: string,
  file: string
): RuleTester.ValidTestCase => {
  const { code, filename } = fixtureCase(directory, file);
  const testCase: RuleTester.ValidTestCase = { name, code, filename };

  return testCase;
};

export const invalidCase = (
  name: string,
  directory: string,
  file: string,
  errors: RuleTester.TestCaseError[]
): RuleTester.InvalidTestCase => {
  const { code, filename } = fixtureCase(directory, file);
  const testCase: RuleTester.InvalidTestCase = {
    name,
    code,
    filename,
    errors
  };

  return testCase;
};
