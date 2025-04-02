import nx from '@nx/eslint-plugin';
import importPlugin from 'eslint-plugin-import';

export const typescript = [
  // NOTE: Checks for 'prettier' and 'eslint-plugin-prettier'
  importPlugin.flatConfigs.typescript,
  ...nx.configs['flat/typescript'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    rules: {
      '@typescript-eslint/explicit-member-accessibility': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-empty-function': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/prefer-readonly': 'error',
    },
  },
  {
    files: ['**/*.action.ts'],
    rules: {
      'max-classes-per-file': 'off',
    },
  },
  {
    files: ['**/*.state.ts'],
    rules: {
      'class-methods-use-this': 'off',
    },
  },
];
