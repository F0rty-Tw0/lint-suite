import nx from '@nx/eslint-plugin';
import importPlugin from 'eslint-plugin-import';

export const typescript = [
  // NOTE: Checks for 'prettier' and 'eslint-plugin-prettier'
  ...nx.configs['flat/typescript'],
  importPlugin.flatConfigs.typescript,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-member-accessibility': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/no-empty-function': 'error',
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
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/dot-notation': 'off',
      'max-lines': [
        'error',
        {
          max: 300,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
];
