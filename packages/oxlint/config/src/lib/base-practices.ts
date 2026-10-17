import type { OxlintConfig } from 'oxlint';

import {
  ESLINT_JS_PLUGIN,
  STYLISTIC_PLUGIN
} from '../common/js-plugin.const.ts';

export const basePractices: OxlintConfig = {
  jsPlugins: [STYLISTIC_PLUGIN, ESLINT_JS_PLUGIN],
  rules: {
    '@stylistic/padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: 'export', next: ['export', 'const'] },
      { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
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
    'eslint-js/spaced-comment': [
      'error',
      'always',
      { block: { exceptions: ['*'], balanced: false } }
    ],
    'eslint/eqeqeq': ['error', 'always', { null: 'ignore' }],
    'eslint/grouped-accessor-pairs': [
      'error',
      'getBeforeSet',
      { enforceForTSTypes: false }
    ],
    'eslint/max-depth': ['warn', 4],
    'eslint/max-params': ['warn', 4],
    'eslint/no-alert': 'error',
    'eslint/no-console': ['warn', { allow: ['warn', 'error'] }],
    'eslint/no-debugger': 'error',
    'eslint/no-else-return': ['error', { allowElseIf: false }],
    'eslint/no-lonely-if': 'error',
    'eslint/no-multi-assign': ['error', { ignoreNonDeclaration: false }],
    'eslint/no-nested-ternary': 'error',
    'eslint/no-object-constructor': 'error',
    'eslint/no-param-reassign': 'error',
    'eslint/no-underscore-dangle': [
      'error',
      {
        allow: [],
        allowAfterSuper: false,
        allowAfterThis: false,
        allowAfterThisConstructor: false,
        allowFunctionParams: true,
        allowInArrayDestructuring: true,
        allowInObjectDestructuring: true,
        enforceInClassFields: false,
        enforceInMethodNames: false
      }
    ],
    'eslint/no-useless-assignment': 'error',
    'eslint/no-useless-concat': 'error',
    'eslint/no-var': 'error',
    'eslint/object-shorthand': ['error', 'always'],
    'eslint/prefer-arrow-callback': [
      'error',
      { allowNamedFunctions: false, allowUnboundThis: true }
    ],
    'eslint/prefer-const': [
      'error',
      { destructuring: 'all', ignoreReadBeforeAssign: false }
    ],
    'eslint/prefer-template': 'error',
    'eslint/radix': 'error',
    'eslint/sort-imports': [
      'error',
      {
        allowSeparatedGroups: true,
        ignoreCase: false,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single']
      }
    ],
    'eslint/yoda': [
      'error',
      'never',
      { exceptRange: false, onlyEquality: false }
    ]
  }
};
