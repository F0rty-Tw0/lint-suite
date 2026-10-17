import type { OxlintConfig } from 'oxlint';

import { JS_FILES } from '../common/file-globs.const.ts';
import { ESLINT_JS_PLUGIN } from '../common/js-plugin.const.ts';

export const javascriptRecommended: OxlintConfig = {
  jsPlugins: [ESLINT_JS_PLUGIN],
  rules: {
    'eslint-js/no-octal': 'error',
    'eslint/for-direction': 'error',
    'eslint/no-array-constructor': 'error',
    'eslint/no-async-promise-executor': 'error',
    'eslint/no-case-declarations': 'error',
    'eslint/no-compare-neg-zero': 'error',
    'eslint/no-cond-assign': ['error', 'except-parens'],
    'eslint/no-constant-binary-expression': [
      'error',
      { checkRelationalComparisons: false }
    ],
    'eslint/no-constant-condition': [
      'error',
      { checkLoops: 'allExceptWhileTrue' }
    ],
    'eslint/no-control-regex': 'error',
    'eslint/no-delete-var': 'error',
    'eslint/no-dupe-else-if': 'error',
    'eslint/no-duplicate-case': 'error',
    'eslint/no-empty': ['error', { allowEmptyCatch: false }],
    'eslint/no-empty-character-class': 'error',
    'eslint/no-empty-function': ['error', { allow: [] }],
    'eslint/no-empty-pattern': [
      'error',
      { allowObjectPatternsAsParameters: false }
    ],
    'eslint/no-empty-static-block': 'error',
    'eslint/no-ex-assign': 'error',
    'eslint/no-extra-boolean-cast': ['error', {}],
    'eslint/no-fallthrough': [
      'error',
      { allowEmptyCase: false, reportUnusedFallthroughComment: false }
    ],
    'eslint/no-global-assign': ['error', { exceptions: [] }],
    'eslint/no-invalid-regexp': ['error', {}],
    'eslint/no-irregular-whitespace': [
      'error',
      {
        skipComments: false,
        skipJSXText: false,
        skipRegExps: false,
        skipStrings: true,
        skipTemplates: false
      }
    ],
    'eslint/no-loss-of-precision': 'error',
    'eslint/no-misleading-character-class': ['error', { allowEscape: false }],
    'eslint/no-nonoctal-decimal-escape': 'error',
    'eslint/no-prototype-builtins': 'error',
    'eslint/no-regex-spaces': 'error',
    'eslint/no-self-assign': ['error', { props: true }],
    'eslint/no-shadow-restricted-names': ['error', { reportGlobalThis: true }],
    'eslint/no-sparse-arrays': 'error',
    'eslint/no-unassigned-vars': 'error',
    'eslint/no-unsafe-finally': 'error',
    'eslint/no-unsafe-optional-chaining': [
      'error',
      { disallowArithmeticOperators: false }
    ],
    'eslint/no-unused-labels': 'error',
    'eslint/no-unused-private-class-members': 'error',
    'eslint/no-useless-backreference': 'error',
    'eslint/no-useless-catch': 'error',
    'eslint/no-useless-escape': ['error', { allowRegexCharacters: [] }],
    'eslint/prefer-rest-params': 'error',
    'eslint/prefer-spread': 'error',
    'eslint/preserve-caught-error': ['error', { requireCatchParameter: false }],
    'eslint/require-yield': 'error',
    'eslint/use-isnan': [
      'error',
      { enforceForIndexOf: false, enforceForSwitchCase: true }
    ],
    'eslint/valid-typeof': ['error', { requireStringLiterals: false }]
  },
  overrides: [
    {
      files: JS_FILES,
      rules: {
        'eslint-js/no-dupe-args': 'error',
        'eslint/constructor-super': 'error',
        'eslint/getter-return': ['error', { allowImplicit: false }],
        'eslint/no-class-assign': 'error',
        'eslint/no-const-assign': 'error',
        'eslint/no-dupe-class-members': 'error',
        'eslint/no-dupe-keys': 'error',
        'eslint/no-func-assign': 'error',
        'eslint/no-import-assign': 'error',
        'eslint/no-new-native-nonconstructor': 'error',
        'eslint/no-obj-calls': 'error',
        'eslint/no-redeclare': ['error', { builtinGlobals: true }],
        'eslint/no-setter-return': 'error',
        'eslint/no-this-before-super': 'error',
        'eslint/no-undef': ['error', { typeof: false }],
        'eslint/no-unreachable': 'error',
        'eslint/no-unsafe-negation': [
          'error',
          { enforceForOrderingRelations: false }
        ],
        'eslint/no-unused-expressions': [
          'error',
          {
            allowShortCircuit: false,
            allowTernary: false,
            allowTaggedTemplates: false,
            enforceForJSX: false,
            ignoreDirectives: false
          }
        ],
        'eslint/no-unused-vars': [
          'error',
          {
            vars: 'all',
            args: 'after-used',
            ignoreRestSiblings: false,
            caughtErrors: 'all',
            ignoreClassWithStaticInitBlock: false,
            ignoreUsingDeclarations: false,
            reportUsedIgnorePattern: false
          }
        ],
        'eslint/no-with': 'error'
      }
    }
  ]
};
