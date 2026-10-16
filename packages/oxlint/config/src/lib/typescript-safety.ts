import type { OxlintConfig } from 'oxlint';

import { TS_FILES } from '../common/file-globs.const.ts';
import { ESLINT_JS_PLUGIN, LOCAL_PLUGIN } from '../common/js-plugin.const.ts';

export const typescriptSafety: OxlintConfig = {
  jsPlugins: [ESLINT_JS_PLUGIN, LOCAL_PLUGIN],
  overrides: [
    {
      files: TS_FILES,
      rules: {
        'eslint-js/no-restricted-syntax': [
          'error',
          {
            selector: 'TSEnumDeclaration[declare!=true]',
            message:
              'enum is not erasable syntax; use a union of literals or an as-const object.'
          },
          {
            selector: 'TSModuleDeclaration[kind="namespace"][declare!=true]',
            message: 'namespace is not erasable syntax; use a module.'
          }
        ],
        'eslint/no-shadow': 'error',
        'eslint/no-unused-expressions': [
          'error',
          {
            allowShortCircuit: true,
            allowTaggedTemplates: false,
            allowTernary: true
          }
        ],
        'eslint/no-unused-vars': 'error',
        'eslint/no-use-before-define': 'error',
        'eslint/no-useless-constructor': 'error',
        'local/arrow-fits-line': 'error',
        'local/chain-fits-line': 'error',
        'local/chain-receiver-name': 'error',
        'local/explicit-accessibility': 'error',
        'local/max-condition-operands': 'error',
        'local/no-call-in-condition': 'error',
        'local/no-grouped-condition': 'error',
        'local/no-inline-object-types': 'error',
        'local/no-inline-return-object': 'error',
        'local/no-nested-object-value': 'error',
        'local/no-spread-expression': 'error',
        'local/one-line-guard': ['error', { maxLineLength: 135 }],
        'local/readonly-type-properties': 'error',
        'local/ternary-branch-shape': 'error',
        'local/test-file-shape': 'error',
        'local/type-placement': 'error',
        'local/util-purity': 'error',
        'typescript/explicit-function-return-type': 'error',
        'typescript/explicit-module-boundary-types': 'error',
        'typescript/no-dynamic-delete': 'error',
        'typescript/no-empty-object-type': 'error',
        'typescript/no-explicit-any': 'error',
        'typescript/no-extraneous-class': [
          'error',
          { allowWithDecorator: true }
        ],
        'typescript/no-inferrable-types': 'warn',
        'typescript/no-invalid-void-type': 'error',
        'typescript/no-non-null-asserted-nullish-coalescing': 'error',
        'typescript/no-non-null-assertion': 'error',
        'typescript/no-require-imports': 'error',
        'typescript/no-unsafe-function-type': 'error',
        'typescript/no-wrapper-object-types': 'error',
        'typescript/parameter-properties': 'error',
        'typescript/prefer-as-const': 'error',
        'typescript/prefer-for-of': 'error',
        'typescript/unified-signatures': 'error'
      }
    }
  ]
};
