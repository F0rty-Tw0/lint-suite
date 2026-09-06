import type { RuleTester } from 'eslint';

import { rule, ruleTester } from './test/utils/rule-under-test.spec.util.ts';

const MOCK_FILE = 'src/app/test/mocks/mailer.mock.ts';
const MAILER_TYPE = 'type Mailer = { send: () => void };';

const mockNameError = (name: string): RuleTester.TestCaseError => {
  const data = { name };
  const error: RuleTester.TestCaseError = { messageId: 'mockName', data };

  return error;
};

const mockFactoryError = (name: string): RuleTester.TestCaseError => {
  const data = { name };
  const error: RuleTester.TestCaseError = { messageId: 'mockFactory', data };

  return error;
};

const mockReturnTypeError = (name: string): RuleTester.TestCaseError => {
  const data = { name };
  const error: RuleTester.TestCaseError = { messageId: 'mockReturnType', data };

  return error;
};

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts a well-formed mock under test/mocks/',
    code: `${MAILER_TYPE} export const mailerMock = (): Mailer => ({ send: vi.fn() });`,
    filename: MOCK_FILE
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'rejects a mock name that is not camelCase',
    code: `${MAILER_TYPE} export const MAILER_MOCK = (): Mailer => ({ send: vi.fn() });`,
    filename: MOCK_FILE,
    errors: [mockNameError('MAILER_MOCK')]
  },
  {
    name: "rejects a mock name that does not end in 'Mock'",
    code: `${MAILER_TYPE} export const mailer = (): Mailer => ({ send: vi.fn() });`,
    filename: MOCK_FILE,
    errors: [mockNameError('mailer')]
  },
  {
    name: 'rejects a mock export that is not a function',
    code: 'export const mailerMock = { send: 1 };',
    filename: MOCK_FILE,
    errors: [mockFactoryError('mailerMock')]
  },
  {
    name: 'rejects a mock factory with no explicit return type',
    code: 'export const mailerMock = () => ({});',
    filename: MOCK_FILE,
    errors: [mockReturnTypeError('mailerMock')]
  },
  {
    name: 'rejects a type exported from a mock file',
    code: 'export type X = 1;',
    filename: MOCK_FILE,
    errors: [mockFactoryError('X')]
  }
];

ruleTester.run('local/test-file-shape', rule, { valid, invalid });
