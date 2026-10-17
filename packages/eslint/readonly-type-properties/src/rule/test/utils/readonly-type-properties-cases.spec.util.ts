import type { RuleTester } from 'eslint';

export const missingReadonly = (
  name: string,
  output: string
): RuleTester.TestCaseError => {
  const data = { name };
  const addReadonly: RuleTester.SuggestionOutput = {
    messageId: 'addReadonly',
    data,
    output
  };
  const suggestions = [addReadonly];
  const error: RuleTester.TestCaseError = {
    messageId: 'missingReadonly',
    data,
    suggestions
  };

  return error;
};

export const readonlyArray = (
  replacement: string,
  output: string
): RuleTester.TestCaseError => {
  const data = { replacement };
  const useMutableArray: RuleTester.SuggestionOutput = {
    messageId: 'useMutableArray',
    data,
    output
  };
  const suggestions = [useMutableArray];
  const error: RuleTester.TestCaseError = {
    messageId: 'readonlyArray',
    suggestions
  };

  return error;
};
