import type { OxlintConfig } from 'oxlint';

import { TS_FILES } from '../common/file-globs.const.ts';

export const typescriptRecommended: OxlintConfig = {
  overrides: [
    {
      files: TS_FILES,
      rules: {
        'typescript/adjacent-overload-signatures': 'error',
        'typescript/ban-ts-comment': 'error',
        'typescript/no-duplicate-enum-values': 'error',
        'typescript/no-extra-non-null-assertion': 'error',
        'typescript/no-misused-new': 'error',
        'typescript/no-namespace': 'error',
        'typescript/no-non-null-asserted-optional-chain': 'error',
        'typescript/no-this-alias': 'error',
        'typescript/no-unnecessary-type-constraint': 'error',
        'typescript/no-unsafe-declaration-merging': 'error',
        'typescript/prefer-namespace-keyword': 'error',
        'typescript/triple-slash-reference': 'error'
      }
    }
  ]
};
