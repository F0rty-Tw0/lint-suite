import type { RuleTester } from 'eslint';

import { rule, ruleTester } from './test/utils/rule-under-test.spec.util.ts';

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
    name: 'accepts a well-formed stub',
    code: 'export const USER_STUB: User = { id: 1 };',
    filename: 'src/app/test/stubs/user.stub.ts'
  },
  {
    name: 'accepts a well-formed multi-segment stub name',
    code: 'export const ADMIN_USER_STUB: User = { id: 2 };',
    filename: 'src/app/test/stubs/admin-user.stub.ts'
  },
  {
    name: 'accepts a well-formed stub inside a testing library',
    code: 'export const USER_STUB: User = { id: 1 };',
    filename: 'libs/testing/src/lib/stubs/user.stub.ts'
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'rejects a stub whose name is not SCREAMING_SNAKE_CASE',
    code: 'export const userStub: User = { id: 1 };',
    filename: 'src/app/test/stubs/user.stub.ts',
    errors: [stubNameError('userStub')]
  },
  {
    name: 'rejects a stub whose name does not end in _STUB',
    code: 'export const USER: User = { id: 1 };',
    filename: 'src/app/test/stubs/user.stub.ts',
    errors: [stubNameError('USER')]
  },
  {
    name: 'rejects a stub with no type annotation',
    code: 'export const USER_STUB = { id: 1 };',
    filename: 'src/app/test/stubs/user.stub.ts',
    errors: [stubTypeError('USER_STUB')]
  }
];

ruleTester.run('local/test-file-shape', rule, { valid, invalid });
