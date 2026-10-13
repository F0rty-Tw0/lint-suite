import type { RuleTester } from 'eslint';

import { rule, ruleTester } from './test/utils/rule-under-test.spec.util.ts';

const forbiddenTestFileError = (shape: string): RuleTester.TestCaseError => {
  const data = { shape };
  const error: RuleTester.TestCaseError = {
    messageId: 'forbiddenTestFile',
    data
  };

  return error;
};

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts an ordinary source file',
    code: 'export const value = 1;',
    filename: 'src/app/user.service.ts'
  },
  {
    name: 'accepts a spec util under test/utils/',
    code: 'export const userHarness = () => ({});',
    filename: 'src/app/test/utils/user.spec.util.ts'
  },
  {
    name: 'accepts a fixture under a testing library',
    code: 'export const a = 1;',
    filename: 'libs/testing/src/lib/fixtures/a.ts'
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
    name: 'rejects a stub under common/stubs/',
    code: 'export const x = 1;',
    filename: 'src/app/common/stubs/user.stub.ts',
    errors: [forbiddenTestFileError('common/stubs/')]
  },
  {
    name: 'rejects a fixtures directory outside test/fixtures/',
    code: 'export const x = 1;',
    filename: 'src/app/fixtures/a.ts',
    errors: [forbiddenTestFileError('fixtures/ outside test/fixtures/')]
  },
  {
    name: 'rejects a fixture under common/fixtures/',
    code: 'export const x = 1;',
    filename: 'src/app/common/fixtures/a.ts',
    errors: [forbiddenTestFileError('fixtures/ outside test/fixtures/')]
  },
  {
    name: 'rejects a .spec.util.ts file outside test/utils/',
    code: 'export const x = 1;',
    filename: 'src/app/utils/x.spec.util.ts',
    errors: [forbiddenTestFileError('.spec.util.ts outside test/utils/')]
  },
  {
    name: 'rejects a .mock.ts file outside test/mocks/',
    code: 'export const x = 1;',
    filename: 'src/app/x.mock.ts',
    errors: [forbiddenTestFileError('.mock.ts outside test/mocks/')]
  }
];

ruleTester.run('test-file-shape/test-file-shape', rule, { valid, invalid });
