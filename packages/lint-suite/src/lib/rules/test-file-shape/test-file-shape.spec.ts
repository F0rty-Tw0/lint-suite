import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import { typescript } from '../../typescript.ts';

const rule = typescript.map((config) => config.plugins?.['local']).find(Boolean)
  ?.rules?.['test-file-shape'];

assert.ok(rule, 'typescript preset must register local/test-file-shape');

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

const ruleTester = new RuleTester({ languageOptions });

const forbiddenTestFileError = (shape: string): RuleTester.TestCaseError => {
  const data = { shape };
  const error: RuleTester.TestCaseError = { messageId: 'forbiddenTestFile', data };

  return error;
};

const stubNameError = (name: string): RuleTester.TestCaseError => {
  const data = { name };
  const error: RuleTester.TestCaseError = { messageId: 'stubName', data };

  return error;
};

const stubTypeError = (name: string): RuleTester.TestCaseError => {
  const data = { name };
  const error: RuleTester.TestCaseError = { messageId: 'stubType', data };

  return error;
};

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts an ordinary source file',
    code: 'export const value = 1;',
    filename: 'src/app/user.service.ts'
  },
  {
    name: 'accepts a well-formed stub',
    code: 'export const USER_STUB: User = { id: 1 };',
    filename: 'src/app/common/stubs/user.stub.ts'
  },
  {
    name: 'accepts a well-formed multi-segment stub name',
    code: 'export const ADMIN_USER_STUB: User = { id: 2 };',
    filename: 'src/app/common/stubs/admin-user.stub.ts'
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'rejects a .spec-support.ts file',
    code: 'export const x = 1;',
    filename: 'src/app/user.spec-support.ts',
    errors: [forbiddenTestFileError('.spec-support.ts')]
  },
  {
    name: 'rejects a .spec-helper.ts file',
    code: 'export const x = 1;',
    filename: 'src/app/user.spec-helper.ts',
    errors: [forbiddenTestFileError('.spec-helper.ts')]
  },
  {
    name: 'rejects a .test-utils.ts file',
    code: 'export const x = 1;',
    filename: 'src/app/user.test-utils.ts',
    errors: [forbiddenTestFileError('.test-utils.ts')]
  },
  {
    name: 'rejects a -fixture.ts file',
    code: 'export const x = 1;',
    filename: 'src/app/user-fixture.ts',
    errors: [forbiddenTestFileError('-fixture.ts')]
  },
  {
    name: 'rejects a file under __mocks__',
    code: 'export const x = 1;',
    filename: 'src/app/__mocks__/user.ts',
    errors: [forbiddenTestFileError('__mocks__/')]
  },
  {
    name: 'rejects a file under helpers',
    code: 'export const x = 1;',
    filename: 'src/app/helpers/user.ts',
    errors: [forbiddenTestFileError('helpers/')]
  },
  {
    name: 'rejects a Windows-style forbidden path',
    code: 'export const x = 1;',
    filename: 'src\\app\\__mocks__\\user.ts',
    errors: [forbiddenTestFileError('__mocks__/')]
  },
  {
    name: 'rejects a stub whose name is not SCREAMING_SNAKE_CASE',
    code: 'export const userStub: User = { id: 1 };',
    filename: 'src/app/common/stubs/user.stub.ts',
    errors: [stubNameError('userStub')]
  },
  {
    name: 'rejects a stub whose name does not end in _STUB',
    code: 'export const USER: User = { id: 1 };',
    filename: 'src/app/common/stubs/user.stub.ts',
    errors: [stubNameError('USER')]
  },
  {
    name: 'rejects a stub with no type annotation',
    code: 'export const USER_STUB = { id: 1 };',
    filename: 'src/app/common/stubs/user.stub.ts',
    errors: [stubTypeError('USER_STUB')]
  }
];

ruleTester.run('local/test-file-shape', rule, { valid, invalid });
