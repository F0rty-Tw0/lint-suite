import type { OxlintConfig } from 'oxlint';

import { typescriptConsistency } from './typescript-consistency.ts';
import { typescriptImports } from './typescript-imports.ts';
import { typescriptOverrides } from './typescript-overrides.ts';
import { typescriptRecommended } from './typescript-recommended.ts';
import { typescriptSafety } from './typescript-safety.ts';

export const typescript: OxlintConfig = {
  categories: { correctness: 'off' },
  plugins: ['import'],
  extends: [
    typescriptRecommended,
    typescriptSafety,
    typescriptConsistency,
    typescriptImports,
    typescriptOverrides
  ]
};
