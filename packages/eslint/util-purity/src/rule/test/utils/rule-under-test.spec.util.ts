import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { ESLint, Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import plugin from '../../../index.ts';

const pluginRule = plugin.rules?.['util-purity'];

assert.ok(pluginRule);

const rule: NonNullable<ESLint.Plugin['rules']>[string] = pluginRule;

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

export { rule };

export const ruleName = 'util-purity/util-purity';

export const ruleTester = new RuleTester({ languageOptions });
