import { defineConfig } from 'eslint/config';

import { baseLimits } from './base-limits.ts';
import { basePractices } from './base-practices.ts';
import { baseRecommended } from './base-recommended.ts';

export const base = defineConfig([
  ...baseRecommended,
  ...basePractices,
  ...baseLimits
]);
