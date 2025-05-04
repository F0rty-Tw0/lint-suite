import type { Linter } from 'eslint';
import jestEslint from 'eslint-plugin-jest';

export const jest: Linter.Config[] = [
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.js', '**/*.test.js'],
    ...jestEslint.configs['flat/all'],
    rules: {
      'jest/no-done-callback': 'off'
    }
  }
];
