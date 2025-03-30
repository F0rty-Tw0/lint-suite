import jestEslint from 'eslint-plugin-jest';
import type { Linter } from 'eslint';

export const jest: Linter.Config[] = [
  {
    files: ['**/*.spec.ts'],
    ...jestEslint.configs['flat/recommended'],
    rules: {
      ...jestEslint.configs['flat/recommended'].rules,
      ...jestEslint.configs['flat/style'].rules,
      'jest/no-done-callback': 'off',
    },
  },
];
