import type { OxlintConfig } from 'oxlint';

import { VITEST_FILES } from '../common/file-globs.const.ts';

export const vitest: OxlintConfig = {
  categories: { correctness: 'off' },
  plugins: ['vitest'],
  overrides: [
    {
      files: VITEST_FILES,
      rules: {
        'vitest/expect-expect': [
          'error',
          {
            assertFunctionNames: ['expect', 'assert'],
            additionalTestBlockFunctions: []
          }
        ],
        'vitest/no-commented-out-tests': 'error',
        'vitest/no-conditional-expect': 'error',
        'vitest/no-disabled-tests': 'warn',
        'vitest/no-focused-tests': 'error',
        'vitest/no-identical-title': 'error',
        'vitest/no-import-node-test': 'error',
        'vitest/no-interpolation-in-snapshots': 'error',
        'vitest/no-mocks-import': 'error',
        'vitest/no-standalone-expect': [
          'error',
          { additionalTestBlockFunctions: [] }
        ],
        'vitest/no-unneeded-async-expect-function': 'error',
        'vitest/prefer-called-exactly-once-with': 'error',
        'vitest/require-local-test-context-for-concurrent-snapshots': 'error',
        'vitest/valid-describe-callback': 'error',
        'vitest/valid-expect': [
          'error',
          {
            alwaysAwait: false,
            asyncMatchers: ['toReject', 'toResolve'],
            minArgs: 1,
            maxArgs: 1
          }
        ],
        'vitest/valid-expect-in-promise': 'error',
        'vitest/valid-title': [
          'error',
          {
            ignoreTypeOfDescribeName: false,
            allowArguments: false,
            disallowedWords: []
          }
        ],
        'vitest/max-nested-describe': ['error', { max: 3 }],
        'vitest/prefer-to-be': 'error',
        'vitest/prefer-to-contain': 'error',
        'vitest/prefer-to-have-length': 'error',
        'vitest/prefer-comparison-matcher': 'error',
        'vitest/prefer-strict-equal': 'warn',
        'vitest/prefer-spy-on': 'error',
        'vitest/prefer-hooks-on-top': 'error',
        'vitest/prefer-each': 'warn',
        'vitest/no-test-return-statement': 'error',
        'vitest/prefer-mock-promise-shorthand': 'error'
      }
    }
  ]
};
