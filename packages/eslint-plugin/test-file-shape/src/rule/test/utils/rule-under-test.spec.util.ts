import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { ESLint, Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import plugin from '../../../index.ts';

const pluginRule = plugin.rules?.['test-file-shape'];

assert.ok(pluginRule);

export const rule: NonNullable<ESLint.Plugin['rules']>[string] = pluginRule;

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

export const ruleTester = new RuleTester({ languageOptions });
