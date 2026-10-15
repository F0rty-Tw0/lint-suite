import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

export const LINTER_LANGUAGE_OPTIONS_STUB: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

export const LINTER_CONFIG_STUB: Linter.Config = {
  files: ['**/*.ts'],
  languageOptions: LINTER_LANGUAGE_OPTIONS_STUB
};
