import type { OxlintConfig } from 'oxlint';

import { base } from './base.ts';
import { boundaries } from './boundaries.ts';
import { javascript } from './javascript.ts';
import { typescript } from './typescript.ts';

export const recommended: OxlintConfig = {
  categories: { correctness: 'off' },
  extends: [base, javascript, typescript, boundaries]
};
