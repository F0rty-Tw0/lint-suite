import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

export const LINTER_CONFIG_STUB: Linter.Config = {
  files: ['**/*.ts'],
  languageOptions
};
