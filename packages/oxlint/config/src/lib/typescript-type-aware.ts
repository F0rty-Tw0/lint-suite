import type { OxlintConfig } from 'oxlint';

import { TS_FILES } from '../common/file-globs.const.ts';

export const typescriptTypeAware: OxlintConfig = {
  categories: { correctness: 'off' },
  options: { typeAware: true },
  overrides: [
    {
      files: TS_FILES,
      rules: {
        'typescript/await-thenable': 'error',
        'typescript/dot-notation': [
          'error',
          {
            allowIndexSignaturePropertyAccess: false,
            allowKeywords: true,
            allowPattern: '',
            allowPrivateClassPropertyAccess: false,
            allowProtectedClassPropertyAccess: false
          }
        ],
        'typescript/no-array-delete': 'error',
        'typescript/no-confusing-void-expression': [
          'error',
          { ignoreArrowShorthand: true, ignoreVoidOperator: true }
        ],
        'typescript/no-floating-promises': ['error', { ignoreVoid: true }],
        'typescript/no-generated-empty-object-type': 'error',
        'typescript/no-misused-promises': 'warn',
        'typescript/no-unnecessary-condition': 'error',
        'typescript/no-unsafe-argument': 'error',
        'typescript/no-unsafe-assignment': 'error',
        'typescript/no-unsafe-call': 'error',
        'typescript/no-unsafe-member-access': 'error',
        'typescript/no-unsafe-return': 'error',
        'typescript/only-throw-error': 'error',
        'typescript/prefer-find': 'error',
        'typescript/prefer-includes': 'error',
        'typescript/prefer-nullish-coalescing': 'error',
        'typescript/prefer-optional-chain': 'error',
        'typescript/prefer-readonly': 'error',
        'typescript/prefer-regexp-exec': 'error',
        'typescript/prefer-string-starts-ends-with': 'error',
        'typescript/promise-function-async': 'error',
        'typescript/require-await': 'error',
        'typescript/restrict-plus-operands': 'error',
        'typescript/restrict-template-expressions': [
          'error',
          { allowBoolean: true, allowNumber: true }
        ],
        'typescript/return-await': ['error', 'in-try-catch'],
        'typescript/switch-exhaustiveness-check': 'error'
      }
    }
  ]
};
