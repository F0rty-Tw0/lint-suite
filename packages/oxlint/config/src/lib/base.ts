import type { OxlintConfig } from 'oxlint';

import { baseLimits } from './base-limits.ts';
import { basePractices } from './base-practices.ts';
import { baseRecommended } from './base-recommended.ts';

export const base: OxlintConfig = {
  categories: { correctness: 'off' },
  plugins: ['import'],
  extends: [baseRecommended, basePractices, baseLimits]
};
