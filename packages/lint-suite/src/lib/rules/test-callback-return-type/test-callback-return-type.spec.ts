import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import { vitest } from '../../vitest.ts';

const rule = vitest.map((config) => config.plugins?.['local']).find(Boolean)
  ?.rules?.['test-callback-return-type'];

assert.ok(rule, 'vitest preset must register local/test-callback-return-type');

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

const ruleTester = new RuleTester({ languageOptions });

const missingReturnTypeError: RuleTester.TestCaseError = {
  messageId: 'missingReturnType'
};

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts an it callback with an explicit return type',
    code: `it('name', (): void => {});`
  },
  {
    name: 'ignores a callback passed to a non-harness call',
    code: `foo('name', () => {});`
  },
  {
    name: 'accepts an it.each callback with an explicit return type',
    code: `it.each([1, 2])('name', (x): void => {});`
  },
  {
    name: 'accepts an async it callback with an explicit Promise<void> return type',
    code: `it('name', async (): Promise<void> => {});`
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'fixes an it callback missing a return type',
    code: `it('name', () => {});`,
    output: `it('name', (): void => {});`,
    errors: [missingReturnTypeError]
  },
  {
    name: 'fixes a test callback that is a function expression',
    code: `test('name', function () {});`,
    output: `test('name', function (): void {});`,
    errors: [missingReturnTypeError]
  },
  {
    name: 'fixes a describe callback missing a return type',
    code: `describe('name', () => {});`,
    output: `describe('name', (): void => {});`,
    errors: [missingReturnTypeError]
  },
  {
    name: 'fixes a beforeEach callback missing a return type',
    code: `beforeEach(() => {});`,
    output: `beforeEach((): void => {});`,
    errors: [missingReturnTypeError]
  },
  {
    name: 'fixes an it.only callback missing a return type',
    code: `it.only('name', () => {});`,
    output: `it.only('name', (): void => {});`,
    errors: [missingReturnTypeError]
  },
  {
    name: 'fixes an it.each callback missing a return type',
    code: `it.each([1, 2])('name', (x) => {});`,
    output: `it.each([1, 2])('name', (x): void => {});`,
    errors: [missingReturnTypeError]
  },
  {
    name: 'fixes an async it callback with Promise<void>',
    code: `it('name', async () => {});`,
    output: `it('name', async (): Promise<void> => {});`,
    errors: [missingReturnTypeError]
  },
  {
    name: 'reports a single-param arrow without parens but skips the fix',
    code: `it('name', x => x);`,
    output: null,
    errors: [missingReturnTypeError]
  }
];

ruleTester.run('local/test-callback-return-type', rule, { valid, invalid });
