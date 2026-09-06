import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import { typescript } from '../../../../typescript.ts';

export const rule = typescript
  .map((config) => config.plugins?.['local'])
  .find(Boolean)?.rules?.['test-file-shape'];

assert.ok(rule, 'typescript preset must register local/test-file-shape');

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

export const ruleTester = new RuleTester({ languageOptions });
