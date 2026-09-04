import type { RuleTester } from 'eslint';

import { fixtureCase } from '../../utils/fixture-project.spec.util.js';

const projectAnalysis = { analysis: 'project' };
const projectOptions = [projectAnalysis];

export const memberError = (
  messageId: string,
  name: string
): RuleTester.TestCaseError => {
  const data = { name };
  const error: RuleTester.TestCaseError = { messageId, data };

  return error;
};

export const projectValidCase = (
  name: string,
  directory: string,
  file: string
): RuleTester.ValidTestCase => {
  const { code, filename } = fixtureCase(directory, file);
  const validCase: RuleTester.ValidTestCase = {
    name,
    code,
    filename,
    options: projectOptions
  };

  return validCase;
};

export const projectInvalidCase = (
  name: string,
  directory: string,
  file: string,
  errors: RuleTester.TestCaseError[]
): RuleTester.InvalidTestCase => {
  const { code, filename } = fixtureCase(directory, file);
  const invalidCase: RuleTester.InvalidTestCase = {
    name,
    code,
    filename,
    options: projectOptions,
    errors
  };

  return invalidCase;
};
