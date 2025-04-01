import rxjsEslint from '@smarttools/eslint-plugin-rxjs';
import type { Linter } from 'eslint';
import { workspaceRoot } from '@nx/devkit';

export const rxjs: Linter.Config[] = [
  {
    files: ['**/*'],
    plugins: {
      rxjs: rxjsEslint,
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: workspaceRoot,
      },
    },
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
  rxjsEslint.configs.recommended,
];
