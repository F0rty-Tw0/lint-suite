import type { OxlintConfig } from 'oxlint';

import { SPEC_FILES, STATE_FILES } from '../common/file-globs.const.ts';

export const baseLimits: OxlintConfig = {
  rules: {
    'eslint/class-methods-use-this': [
      'error',
      {
        enforceForClassFields: true,
        exceptMethods: [],
        ignoreOverrideMethods: false
      }
    ],
    'eslint/complexity': ['warn', 10],
    'eslint/max-lines': [
      'error',
      { max: 150, skipBlankLines: true, skipComments: true }
    ],
    'eslint/max-lines-per-function': [
      'warn',
      { max: 50, skipBlankLines: true, skipComments: true }
    ]
  },
  overrides: [
    {
      files: SPEC_FILES,
      rules: {
        'eslint/complexity': ['warn', { max: 3 }],
        'eslint/max-lines': [
          'error',
          { max: 300, skipBlankLines: true, skipComments: true }
        ],
        'eslint/max-lines-per-function': 'off'
      }
    },
    { files: STATE_FILES, rules: { 'eslint/class-methods-use-this': 'off' } }
  ]
};
