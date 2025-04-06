import nx from '@nx/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import stylistic from '@stylistic/eslint-plugin';

import type { Linter } from 'eslint';

export const base: Linter.Config[] = [
  ...nx.configs['flat/base'],
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
    ...importPlugin.flatConfigs.recommended,
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
    ...stylistic.configs.recommended,
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
      'no-console': 'warn',
      'class-methods-use-this': 'error',
      'max-len': [
        'error',
        {
          code: 135,
          ignoreComments: true,
        },
      ],
      'spaced-comment': [
        2,
        'always',
        {
          block: {
            exceptions: ['*'],
          },
        },
      ],
      '@stylistic/comma-dangle': [
        'error',
        {
          functions: 'never',
          arrays: 'always-multiline',
          exports: 'always-multiline',
          imports: 'always-multiline',
          objects: 'always-multiline',
          enums: 'always-multiline',
        },
      ],
      '@stylistic/indent': [
        'error',
        2,
        {
          offsetTernaryExpressions: true,
          SwitchCase: 1,
          ignoredNodes: [
            'TSTypeParameterInstantiation',
            'FunctionExpression > .params > :matches(Decorator, :not(:first-child))',
          ],
        },
      ],
      'sort-imports': [
        'error',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
          allowSeparatedGroups: true,
        },
      ],
    },
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
      '**/*.html',
    ],
    rules: {
      'max-lines': [
        'error',
        {
          max: 150,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.js', '**/*.test.js'],
    rules: {
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
