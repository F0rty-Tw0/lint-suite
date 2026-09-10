import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';

import { LINTER_LANGUAGE_OPTIONS_STUB } from '../stubs/linter-config.stub.ts';

export const projectRuleTester = (directory: string): RuleTester => {
  const parserOptions = { projectService: true, tsconfigRootDir: directory };
  const languageOptions: Linter.LanguageOptions = {
    ...LINTER_LANGUAGE_OPTIONS_STUB,
    parserOptions
  };

  return new RuleTester({ languageOptions });
};
