import assert from 'node:assert/strict';

import { templateParser } from 'angular-eslint';
import { RuleTester } from 'eslint';
import type { ESLint, Linter } from 'eslint';
import type { CompatibleParser } from 'typescript-eslint';
import { describe, test } from 'vitest';

import plugin from '../../../index.ts';

const pluginName = 'lint-suite-angular-template';

const isCompatibleParser = (value: unknown): value is CompatibleParser => {
  const isObject = typeof value === 'object' && value !== null;

  if (!isObject) return false;

  return 'parseForESLint' in value;
};

const registeredRule = plugin.rules?.['no-unstyled-classes'];
const parser = isCompatibleParser(templateParser) ? templateParser : null;

assert.ok(registeredRule, 'plugin must register no-unstyled-classes');
assert.ok(parser, 'angular-eslint must export a flat config template parser');

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = { parser };

export const rule: NonNullable<ESLint.Plugin['rules']>[string] = registeredRule;

export const ruleName = `${pluginName}/no-unstyled-classes`;

export const ruleTester = new RuleTester({ languageOptions });

export const unstyledClassError = (name: string): RuleTester.TestCaseError => {
  const data = { name };
  const error: RuleTester.TestCaseError = { messageId: 'unstyledClass', data };

  return error;
};
