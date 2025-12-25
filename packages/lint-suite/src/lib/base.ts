import { configs } from '@nx/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import importPluginX from 'eslint-plugin-import-x';
import { defineConfig } from 'eslint/config';

export const base = defineConfig([
  { extends: [...configs['flat/base']] },
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
    extends: [importPluginX.flatConfigs.recommended]
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
    extends: [stylistic.configs.recommended]
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
      'no-param-reassign': 'error',
      'no-alert': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'multi'],
      'prefer-const': ['error', { destructuring: 'all' }],
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'no-useless-concat': 'error',
      'prefer-template': 'error',
      'no-nested-ternary': 'error',
      'no-return-await': 'error',
      'no-else-return': ['error', { allowElseIf: false }], // Prefer early returns
      'no-multi-assign': 'error', // Disallow chaining assignments
      radix: 'error', // Require radix parameter for parseInt()
      yoda: 'error', // Disallow yoda conditions (`if ("red" === color)`)
      complexity: ['warn', 10], // Warn if function complexity is high
      'max-depth': ['warn', 4], // Warn on deeply nested blocks
      'max-lines-per-function': [
        'warn',
        { max: 50, skipBlankLines: true, skipComments: true }
      ], // Warn on long functions
      'max-params': ['warn', 4], // Warn on functions with many parameters
      'no-lonely-if': 'error', // Disallow if statements as the only statement in an else block
      'grouped-accessor-pairs': ['error', 'getBeforeSet'], // Enforce consistency for getters/setters
      'class-methods-use-this': 'error',
      'no-underscore-dangle': 'error',
      'max-len': [
        'error',
        {
          code: 135,
          ignoreComments: true
        }
      ],
      'spaced-comment': [
        2,
        'always',
        {
          block: {
            exceptions: ['*']
          }
        }
      ],
      '@stylistic/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: 'export',
          next: ['export', 'const']
        },
        {
          blankLine: 'always',
          prev: ['const', 'let', 'var'],
          next: '*'
        },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var']
        },
        {
          blankLine: 'always',
          prev: '*',
          next: [
            'for',
            'if',
            'return',
            'throw',
            'switch',
            'try',
            'class',
            'function'
          ]
        }
      ],
      '@stylistic/comma-dangle': [
        'error',
        {
          functions: 'never',
          arrays: 'always-multiline',
          exports: 'always-multiline',
          imports: 'always-multiline',
          objects: 'always-multiline',
          enums: 'always-multiline'
        }
      ],
      '@stylistic/indent': [
        'error',
        2,
        {
          offsetTernaryExpressions: true,
          SwitchCase: 1,
          ignoredNodes: [
            'TSTypeParameterInstantiation',
            'FunctionExpression > .params > :matches(Decorator, :not(:first-child))'
          ]
        }
      ],
      'sort-imports': [
        'error',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
          allowSeparatedGroups: true
        }
      ]
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
      '**/*.mts',
      '**/*.html'
    ],
    rules: {
      'max-lines': [
        'error',
        {
          max: 150,
          skipBlankLines: true,
          skipComments: true
        }
      ]
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
      'max-lines-per-function': 'off',
      complexity: ['warn', { max: 3 }],
      'max-lines': [
        'error',
        {
          max: 300,
          skipBlankLines: true,
          skipComments: true
        }
      ]
    }
  },
  {
    files: ['**/*.action.ts'],
    rules: {
      'max-classes-per-file': 'off'
    }
  },
  {
    files: ['**/*.state.ts'],
    rules: {
      'class-methods-use-this': 'off'
    }
  }
]);
