import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

export const LINTER_CONFIG_STUB: Linter.Config = {
  files: ['**/*.ts'],
  languageOptions: {
    ecmaVersion: 'latest',
    parser: tseslint.parser,
    sourceType: 'module'
  }
};
