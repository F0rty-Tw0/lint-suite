import jestEslint from 'eslint-plugin-jest';
import { defineConfig } from 'eslint/config';

export const jest = defineConfig([
  {
    files: ['**/*.spec.ts', '**/*.spec.js'],
    extends: [jestEslint.configs['flat/recommended']],
    rules: {
      'jest/no-done-callback': 'off',
      // Elevated from recommended defaults
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/valid-expect': 'error',
      // Style rules (selective additions from flat/style)
      'jest/prefer-to-be': 'warn',
      'jest/prefer-to-contain': 'warn',
      'jest/prefer-to-have-length': 'warn',
      // Best practice additions
      'jest/consistent-test-it': ['error', { fn: 'it' }],
      'jest/prefer-comparison-matcher': 'error',
      'jest/prefer-equality-matcher': 'error',
      'jest/prefer-hooks-on-top': 'error',
      'jest/prefer-spy-on': 'error',
      'jest/prefer-strict-equal': 'warn',
      'jest/prefer-mock-promise-shorthand': 'error',
      'jest/no-conditional-in-test': 'warn',
      'jest/no-duplicate-hooks': 'error',
      'jest/no-test-return-statement': 'error',
      'jest/require-to-throw-message': 'warn'
    }
  }
]);
