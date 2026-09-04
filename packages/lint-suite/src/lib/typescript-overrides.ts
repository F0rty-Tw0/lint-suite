import { defineConfig } from 'eslint/config';

export const typescriptOverrides = defineConfig([
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    languageOptions: {
      parserOptions: {
        projectService: true
      }
    },
    rules: {
      '@typescript-eslint/prefer-readonly': 'error'
    }
  },
  {
    files: ['**/*.action.ts'],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-extraneous-class': 'off'
    }
  },
  {
    files: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.spec.js',
      '**/*.test.js',
      '**/*.e2e.ts',
      '**/*.e2e.js'
    ],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off'
    }
  },
  {
    files: ['**/*.stories.ts'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/naming-convention': 'off'
    }
  }
]);
