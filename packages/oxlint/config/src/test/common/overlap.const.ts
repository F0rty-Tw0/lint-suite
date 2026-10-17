import type { Linter } from 'eslint';

const CONSOLE_RULES: Linter.RulesRecord = { 'no-console': 'error' };

export const CONSOLE_ON: Linter.Config = {
  files: ['**/*.ts'],
  rules: CONSOLE_RULES
};
