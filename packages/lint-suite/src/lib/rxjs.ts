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
    plugins: {
      rxjs: rxjsEslint
    }
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
      'rxjs/prefer-observer': 'error',
      'rxjs/finnish': 'warn',
      'rxjs/no-ignored-subscription': 'warn',
      'rxjs/no-ignored-error': 'warn',
      'rxjs/no-unsafe-switchmap': 'error',
      'rxjs/no-unsafe-takeuntil': 'error',
      'rxjs/no-unsafe-catch': 'error',
      'rxjs/no-unsafe-first': 'error',
      'rxjs/no-topromise': 'error',
      'rxjs/throw-error': 'error',
      'rxjs/no-async-subscribe': 'off',
      'rxjs/no-exposed-subjects': 'error', // Enforce subject encapsulation
      'rxjs/no-cyclic-action': 'error', // Prevent infinite loops in NgRx effects
      'rxjs/no-subscribe-handlers': 'warn' // Prefer observer objects (complements prefer-observer)
    }
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.js', '**/*.test.js'],
    rules: {
      'rxjs/no-ignored-subscription': 'off',
      'rxjs/no-subscribe-handlers': 'off'
    }
  }
]);
