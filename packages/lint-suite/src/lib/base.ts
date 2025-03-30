import nx from '@nx/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import stylistic from '@stylistic/eslint-plugin';

import type { Linter } from 'eslint';

export const base: Linter.Config[] = [
  ...nx.configs['flat/base'],
  importPlugin.flatConfigs.recommended,
  stylistic.configs.recommended,
  {
    files: ['**/*.js', '**/*.ts', '**/*.html'],
    plugins: { '@stylistic': stylistic },
    rules: {
      // 'import/namespace': 'off', //NOTE: CAN BE REMOVED WHEN IT DOESN'T CHECK FOR HTML
      'no-console': 'warn',
      'max-len': [
        'error',
        {
          code: 135,
          ignoreComments: true,
        },
      ],
      'max-lines': [
        'error',
        {
          max: 150,
          skipBlankLines: true,
          skipComments: true,
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
      'class-methods-use-this': 'error',
    },
  },
];
