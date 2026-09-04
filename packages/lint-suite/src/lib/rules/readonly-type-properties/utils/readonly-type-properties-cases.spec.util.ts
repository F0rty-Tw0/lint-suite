import type { RuleTester } from 'eslint';

export const missingReadonly = (name: string): RuleTester.TestCaseError => {
  const data = { name };
  const error: RuleTester.TestCaseError = {
    messageId: 'missingReadonly',
    data
  };

  return error;
};
