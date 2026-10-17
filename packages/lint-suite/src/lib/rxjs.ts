import rxjsEslint from '@smarttools/eslint-plugin-rxjs';
import { defineConfig } from 'eslint/config';

export const rxjs = defineConfig([
  {
    files: [
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts'
    ],
    languageOptions: {
      parserOptions: {
        projectService: true
      }
    },
    extends: [rxjsEslint.configs.recommended]
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
      '**/*.mts'
    ],
    rules: {
      '@smarttools/rxjs/prefer-observer': 'error',
      '@smarttools/rxjs/finnish': 'warn',
      '@smarttools/rxjs/no-ignored-subscription': 'warn',
      '@smarttools/rxjs/no-ignored-error': 'warn',
      '@smarttools/rxjs/no-unsafe-switchmap': 'error',
      '@smarttools/rxjs/no-unsafe-catch': 'error',
      '@smarttools/rxjs/no-unsafe-first': 'error',
      '@smarttools/rxjs/no-topromise': 'error',
      '@smarttools/rxjs/throw-error': 'error',
      '@smarttools/rxjs/no-async-subscribe': 'off',
      '@smarttools/rxjs/no-exposed-subjects': 'error', // Enforce subject encapsulation
      '@smarttools/rxjs/no-cyclic-action': 'error', // Prevent infinite loops in NgRx effects
      '@smarttools/rxjs/no-subscribe-handlers': 'warn' // Prefer observer objects (complements prefer-observer)
    }
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.js', '**/*.test.js'],
    rules: {
      '@smarttools/rxjs/no-ignored-subscription': 'off',
      '@smarttools/rxjs/no-subscribe-handlers': 'off'
    }
  }
]);
