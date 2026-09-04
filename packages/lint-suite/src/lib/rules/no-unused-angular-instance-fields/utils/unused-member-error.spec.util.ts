import type { RuleTester } from 'eslint';

import type { MessageIds } from '../rule/common/no-unused-angular-instance-fields.type.ts';

const memberError = (
  messageId: MessageIds,
  name: string
): RuleTester.TestCaseError => {
  const data = { name };
  const error: RuleTester.TestCaseError = { messageId, data };

  return error;
};

export const unusedFieldError = (name: string): RuleTester.TestCaseError => {
  return memberError('unusedField', name);
};

export const unusedMethodError = (name: string): RuleTester.TestCaseError => {
  return memberError('unusedMethod', name);
};
