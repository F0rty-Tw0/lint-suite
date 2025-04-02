import rxjsEslint from '@smarttools/eslint-plugin-rxjs';
import type { Linter } from 'eslint';

export const rxjs: Linter.Config[] = [
  {
    files: [
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    ...rxjsEslint.configs.recommended,
  },
  {
    files: [
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
    ],
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
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.js', '**/*.test.js'],
    rules: {
      'rxjs/no-ignored-subscription': 'off',
    },
  },
];
