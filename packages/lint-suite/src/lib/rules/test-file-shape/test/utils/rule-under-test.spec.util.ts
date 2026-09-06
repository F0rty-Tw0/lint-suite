import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter, Rule } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import { typescript } from '../../../../typescript.ts';

const found = typescript
  .map((config) => config.plugins?.['local'])
  .find(Boolean)?.rules?.['test-file-shape'];

assert.ok(found, 'typescript preset must register local/test-file-shape');

export const rule: Rule.RuleModule = found;

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

export const ruleTester = new RuleTester({ languageOptions });
