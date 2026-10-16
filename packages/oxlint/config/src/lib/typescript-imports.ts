import type { OxlintConfig } from 'oxlint';

import { TS_FILES } from '../common/file-globs.const.ts';

export const typescriptImports: OxlintConfig = {
  plugins: ['import'],
  overrides: [
    {
      files: TS_FILES,
      rules: {
        'import/no-duplicates': 'error',
        'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-anonymous-default-export': 'error',
        'import/no-cycle': [
          'error',
          {
            maxDepth: 2,
            ignoreExternal: true,
            allowUnsafeDynamicCyclicDependency: false
          }
        ],
        'import/no-mutable-exports': 'error',
        'import/no-self-import': 'error'
      }
    }
  ]
};
