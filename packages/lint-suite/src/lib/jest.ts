import jestEslint from 'eslint-plugin-jest';
import { type ConfigArray, config } from 'typescript-eslint';

export const jest: ConfigArray = config([
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.js', '**/*.test.js'],
    extends: [jestEslint.configs['flat/all']],
    rules: {
      'jest/no-done-callback': 'off'
    }
  }
]);
