import type { OxlintConfig } from 'oxlint';

import { TS_FILES } from '../common/file-globs.const.ts';

export const typescriptConsistency: OxlintConfig = {
  overrides: [
    {
      files: TS_FILES,
      rules: {
        'typescript/consistent-type-assertions': [
          'error',
          { assertionStyle: 'never' }
        ],
        'typescript/consistent-type-definitions': ['error', 'type'],
        'typescript/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'separate-type-imports' }
        ]
      }
    }
  ]
};
