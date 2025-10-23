import jestEslint from 'eslint-plugin-jest';
import { defineConfig } from 'eslint/config';

export const jest = defineConfig([
  {
    files: ['**/*.spec.ts', '**/*.spec.js'],
    extends: [jestEslint.configs['flat/all']],
    rules: {
      'jest/no-done-callback': 'off'
    }
  }
]);
