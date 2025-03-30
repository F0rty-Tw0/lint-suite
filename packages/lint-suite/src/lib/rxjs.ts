import rxjsEslint from '@smarttools/eslint-plugin-rxjs';
import type { Linter } from 'eslint';

export const rxjs: Linter.Config[] = [
  rxjsEslint.configs.recommended,
  {
    files: ['**/*.ts'],
    plugins: { rxjs: rxjsEslint },
    rules: {
      'rxjs/prefer-observer': 'error',
      'rxjs/finnish': 'warn',
      'rxjs/no-ignored-error': 'warn',
      'rxjs/no-unsafe-switchmap': 'error',
      'rxjs/no-unsafe-takeuntil': 'error',
      'rxjs/no-unsafe-catch': 'error',
      'rxjs/no-unsafe-first': 'error',
      'rxjs/no-topromise': 'error',
      'rxjs/throw-error': 'error',
      'rxjs/no-async-subscribe': 'off',
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      'rxjs/no-ignored-subscription': 'off',
    },
  },
];
